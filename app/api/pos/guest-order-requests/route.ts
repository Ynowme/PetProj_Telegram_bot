import { NextRequest, NextResponse } from "next/server";
import { verifySecretToken } from "@/lib/webhook-security";
import { getPendingOrderRequestsForTable } from "@/lib/guest-orders";

// Перший pull-напрямок у цій інтеграції (решта — push з CastaPOS): каса не приймає вхідних
// запитів, тож сама опитує цей ендпоінт. GET без тіла — не HMAC-по-тілу, як решта
// webhooks/pos/*, а timing-safe звірка секрету в заголовку (той самий verifySecretToken,
// що вже звіряє Telegram X-Telegram-Bot-Api-Secret-Token).
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-pos-secret");
  if (!verifySecretToken(secret, process.env.POS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const tableCode = request.nextUrl.searchParams.get("tableCode")?.trim();
  if (!tableCode) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  }

  const requests = await getPendingOrderRequestsForTable(tableCode);
  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      items: r.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        comment: item.comment,
        posExternalId: item.menuItem.posExternalId,
        kind: item.menuItem.kind,
      })),
    })),
  });
}
