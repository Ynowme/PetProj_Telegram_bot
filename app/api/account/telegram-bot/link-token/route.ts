import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { issueTelegramBotLinkToken, TelegramBotLinkError } from "@/lib/telegram-bot-link";

// FR-010: доступ к Telegram-боту только для Gold Member с указанным номером телефона.
// Сам номер подтверждается процессом привязки (FR-012), а не заранее.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
      { status: 401 },
    );
  }

  try {
    const { rawToken, expiresAt } = await issueTelegramBotLinkToken(session.user.id);
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const deepLink = botUsername ? `https://t.me/${botUsername}?start=${rawToken}` : null;
    return NextResponse.json({ deepLink, expiresAt });
  } catch (error) {
    if (error instanceof TelegramBotLinkError) {
      const message =
        error.code === "NOT_GOLD_MEMBER"
          ? "Доступ до бота доступний лише Gold Member"
          : "Спочатку вкажіть номер телефону в профілі";
      return NextResponse.json({ error: { code: error.code, message } }, { status: 403 });
    }
    throw error;
  }
}
