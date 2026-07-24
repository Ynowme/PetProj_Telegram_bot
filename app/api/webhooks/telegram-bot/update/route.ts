import { NextRequest, NextResponse } from "next/server";
import { verifySecretToken } from "@/lib/webhook-security";
import { consumeRateLimit } from "@/lib/request-security";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram-bot-client";
import {
  bindTelegramBotLinkChat,
  confirmTelegramBotContactByChat,
  TelegramBotConfirmError,
} from "@/lib/telegram-bot-link";
import { confirmTelegramLoginStart, isTelegramLoginStartToken } from "@/lib/telegram-login";

type TelegramUpdate = {
  message?: {
    text?: string;
    from?: { id: number | string; username?: string; first_name?: string; last_name?: string };
    chat?: { id: number | string };
    contact?: { phone_number: string; user_id?: number | string };
  };
};

const REQUEST_CONTACT_TEXT = "Поділитися номером телефону";
const LINK_INVALID_TEXT =
  "Посилання недійсне або протерміноване. Отримайте нове посилання в особистому кабінеті на сайті.";
const LINK_OK_TEXT = "Готово! Бот привʼязано до вашого акаунта на сайті.";
const LINK_FAILED_TEXT =
  "Не вдалося підтвердити привʼязку. Спробуйте отримати нове посилання в особистому кабінеті на сайті.";
const CONTACT_MISMATCH_TEXT = "Поділіться, будь ласка, власним номером телефону через кнопку нижче.";
const LOGIN_OK_TEXT = "Готово! Повертайтеся на сайт — вхід підтверджено.";
const LOGIN_INVALID_TEXT =
  "Посилання для входу недійсне або протерміноване. Поверніться на сайт і спробуйте ще раз.";

function isValidUpdate(value: unknown): value is TelegramUpdate {
  return !!value && typeof value === "object";
}

function buildSiteUrl(path: string): string | null {
  const base = process.env.NEXTAUTH_URL;
  return base ? `${base.replace(/\/$/, "")}${path}` : null;
}

// Кнопки під підсумковим повідомленням боту: повернення на сайт завжди, «Послуги» —
// тільки для Gold Member (єдиних, хто взагалі бачить цю сторінку в кабінеті).
function buildReturnButtons(includeServices: boolean): { text: string; url: string }[] {
  const buttons: { text: string; url: string }[] = [];
  const accountUrl = buildSiteUrl("/account");
  if (accountUrl) buttons.push({ text: "Повернутися на сайт", url: accountUrl });
  if (includeServices) {
    const servicesUrl = buildSiteUrl("/account/services");
    if (servicesUrl) buttons.push({ text: "Послуги", url: servicesUrl });
  }
  return buttons;
}

// Webhook реальных апдейтов Telegram Bot API (Промт 6). Telegram не подписывает тело —
// единственная защита это secret_token, заданный при setWebhook (см.
// scripts/telegram-bot-set-webhook.ts) и сверяемый здесь до разбора payload.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (!verifySecretToken(secretToken, process.env.TELEGRAM_BOT_UPDATE_SECRET)) {
    return NextResponse.json({ error: { code: "INVALID_SECRET" } }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 });
  }
  if (!isValidUpdate(payload) || !payload.message?.from || !payload.message.chat) {
    // Апдейты без message (edited_message, callback_query и т.п.) сейчас не нужны боту.
    return NextResponse.json({ ok: true });
  }

  const { message } = payload;
  const fromId = String(message.from!.id);
  const chatId = String(message.chat!.id);

  const limit = await consumeRateLimit({
    namespace: "telegram-bot-update",
    identifier: fromId,
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    // Telegram доставит апдейт повторно только при ошибке ответа — тут всё же 200,
    // чтобы не спровоцировать retry-шторм от одного и того же спамящего чата.
    return NextResponse.json({ ok: true });
  }

  if (message.contact) {
    if (String(message.contact.user_id ?? "") !== fromId) {
      await sendTelegramMessage({ chatId, text: CONTACT_MISMATCH_TEXT, requestContactButtonText: REQUEST_CONTACT_TEXT });
      return NextResponse.json({ ok: true });
    }

    try {
      await confirmTelegramBotContactByChat(chatId, {
        telegramUserId: fromId,
        phone: message.contact.phone_number,
      });
      // Привʼязка бота доступна лише Gold Member (issueTelegramBotLinkToken це вимагає) —
      // кнопка «Послуги» тут завжди доречна.
      await sendTelegramMessage({ chatId, text: LINK_OK_TEXT, inlineButtons: buildReturnButtons(true) });
    } catch (error) {
      if (error instanceof TelegramBotConfirmError) {
        const text = error.code === "TOKEN_EXPIRED_OR_USED" ? LINK_INVALID_TEXT : LINK_FAILED_TEXT;
        await sendTelegramMessage({ chatId, text });
      } else {
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  }

  const startMatch = message.text?.match(/^\/start\s+(\S+)/);
  if (startMatch) {
    const rawToken = startMatch[1];

    if (isTelegramLoginStartToken(rawToken)) {
      const confirmed = await confirmTelegramLoginStart(rawToken, {
        telegramUserId: fromId,
        username: message.from!.username,
        firstName: message.from!.first_name,
        lastName: message.from!.last_name,
      });
      if (confirmed) {
        // Сесія створюється пізніше (фронт опитує /status), але telegramId — стабільний
        // ключ, тож для гостя, що вже мав акаунт, роль можна перевірити вже зараз.
        const existingUser = await prisma.user.findUnique({
          where: { telegramId: fromId },
          select: { role: true },
        });
        await sendTelegramMessage({
          chatId,
          text: LOGIN_OK_TEXT,
          inlineButtons: buildReturnButtons(existingUser?.role === "GOLD_MEMBER"),
        });
      } else {
        await sendTelegramMessage({ chatId, text: LOGIN_INVALID_TEXT });
      }
      return NextResponse.json({ ok: true });
    }

    const bound = await bindTelegramBotLinkChat(rawToken, chatId);
    if (!bound) {
      await sendTelegramMessage({ chatId, text: LINK_INVALID_TEXT });
    } else {
      await sendTelegramMessage({
        chatId,
        text: "Щоб підтвердити привʼязку, поділіться своїм номером телефону кнопкою нижче.",
        requestContactButtonText: REQUEST_CONTACT_TEXT,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
