import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/request-security";
import { issueTelegramLoginToken } from "@/lib/telegram-login";

// FR-004: вхід через реального Telegram-бота (deep link t.me/<bot>?start=<token>) замість
// Login Widget, щоб перехід завжди відкривав застосунок Telegram, а не веб-версію.
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await consumeRateLimit({
    namespace: "login:telegram-bot:start",
    identifier: ip,
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }

  const { rawToken, expiresAt } = await issueTelegramLoginToken();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${rawToken}` : null;

  return NextResponse.json({ token: rawToken, deepLink, expiresAt });
}
