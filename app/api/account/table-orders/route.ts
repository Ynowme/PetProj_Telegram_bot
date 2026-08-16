import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { createGuestOrderRequest, GuestOrderError, type GuestOrderItemInput } from "@/lib/guest-orders";
import { consumeRateLimit } from "@/lib/request-security";

const MAX_ITEMS = 50;
const MAX_QUANTITY = 20;
const MAX_COMMENT_LENGTH = 300;

type CreateOrderBody = { items: GuestOrderItemInput[] };

function isValidBody(value: unknown): value is CreateOrderBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.items) &&
    v.items.length > 0 &&
    v.items.length <= MAX_ITEMS &&
    v.items.every((item) => {
      if (!item || typeof item !== "object") return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i.menuItemId === "string" &&
        i.menuItemId.length > 0 &&
        typeof i.quantity === "number" &&
        Number.isInteger(i.quantity) &&
        i.quantity > 0 &&
        i.quantity <= MAX_QUANTITY &&
        (i.comment === undefined || i.comment === null || (typeof i.comment === "string" && i.comment.length <= MAX_COMMENT_LENGTH))
      );
    })
  );
}

const ERROR_STATUS: Record<GuestOrderError["code"], number> = {
  NO_ACTIVE_TABLE_SESSION: 409,
  EMPTY_CART: 400,
  MENU_ITEM_NOT_FOUND: 404,
  MENU_ITEM_NOT_ORDERABLE: 400,
};

// FR: гість зі столу (TableSession CONFIRMED) сам збирає кошик у меню й надсилає заявку —
// не пробиває чек сам, лише "просить" офіціанта додати ці позиції (components/OrderScreen.tsx
// у CastaPOS показує заявку й підтверджує/відхиляє).
export async function POST(request: Request) {
  const { session, response } = await requireUser();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as unknown;
  if (!isValidBody(body)) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  }

  const limit = await consumeRateLimit({
    namespace: "guest-order-request",
    identifier: session.user.id,
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }

  try {
    const orderRequest = await createGuestOrderRequest(session.user.id, body.items);
    return NextResponse.json({ id: orderRequest.id }, { status: 201 });
  } catch (error) {
    if (error instanceof GuestOrderError) {
      return NextResponse.json({ error: { code: error.code } }, { status: ERROR_STATUS[error.code] });
    }
    throw error;
  }
}

// Гість перевіряє статус своїх заявок (PENDING/IMPORTED/REJECTED) на поточну сесію столу.
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const tableSession = await prisma.tableSession.findFirst({
    where: { userId: session.user.id, status: "CONFIRMED" },
    orderBy: { confirmedAt: "desc" },
  });
  if (!tableSession) return NextResponse.json({ requests: [] });

  const requests = await prisma.guestOrderRequest.findMany({
    where: { tableSessionId: tableSession.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { items: true },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      items: r.items.map((item) => ({ name: item.name, price: Number(item.price), quantity: item.quantity, comment: item.comment })),
    })),
  });
}
