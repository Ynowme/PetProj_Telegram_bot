import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/request-security";
import { getTelegramLoginStatus } from "@/lib/telegram-login";

// Опитується фронтом кожні кілька секунд, поки гість не підтвердить вхід у Telegram.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: { code: "INVALID_TOKEN" } }, { status: 400 });
  }

  const limit = await consumeRateLimit({
    namespace: "login:telegram-bot:status",
    identifier: token,
    limit: 320,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }

  const status = await getTelegramLoginStatus(token);
  return NextResponse.json({ status });
}
