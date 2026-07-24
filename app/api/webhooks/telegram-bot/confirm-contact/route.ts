import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { consumeRateLimit } from "@/lib/request-security";
import { confirmTelegramBotContact, TelegramBotConfirmError } from "@/lib/telegram-bot-link";

type ConfirmContactBody = { rawToken: string; telegramUserId: string; phone: string };

function isValidPayload(value: unknown): value is ConfirmContactBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.rawToken === "string" &&
    v.rawToken.length > 0 &&
    typeof v.telegramUserId === "string" &&
    v.telegramUserId.length > 0 &&
    typeof v.phone === "string" &&
    v.phone.length > 0
  );
}

// Webhook от адаптера Telegram-бота (сейчас — внутренний контракт для fake-транспорта;
// реальная интеграция подключит сюда разбор Update из Telegram Bot API). Подпись
// проверяется до разбора payload. FR-012: номер телефона гость подтверждает только
// нажатием кнопки request_contact на стороне бота, не текстом и не через URL.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.TELEGRAM_BOT_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  const limit = await consumeRateLimit({
    namespace: "telegram-bot-confirm",
    identifier: payload.telegramUserId,
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }

  try {
    const result = await confirmTelegramBotContact(payload);
    return NextResponse.json({ linked: true, userId: result.userId });
  } catch (error) {
    if (error instanceof TelegramBotConfirmError) {
      const status = error.code === "TOKEN_EXPIRED_OR_USED" ? 410 : 401;
      return NextResponse.json({ error: { code: error.code } }, { status });
    }
    throw error;
  }
}
