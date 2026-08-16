import { prisma } from "@/lib/prisma";

export class GuestOrderError extends Error {
  constructor(
    public code: "NO_ACTIVE_TABLE_SESSION" | "EMPTY_CART" | "MENU_ITEM_NOT_FOUND" | "MENU_ITEM_NOT_ORDERABLE",
  ) {
    super(code);
  }
}

export type GuestOrderItemInput = { menuItemId: string; quantity: number; comment?: string | null };

// Гість, привʼязаний до столу (TableSession CONFIRMED), надсилає заявку — кожна позиція бере
// знімок name/price з MenuItem саме зараз, бо ціна на боці каси може синкнутись повторно ще до
// того, як офіціант підтвердить (той самий принцип "знімок на момент", що Receipt.items).
// MENU_ITEM_NOT_ORDERABLE: позиції без posExternalId/kind — імпортовані напряму в PetProj
// (scripts/import-menu.ts), каса про них нічого не знає й не зможе прийняти заявку назад.
export async function createGuestOrderRequest(userId: string, items: GuestOrderItemInput[]) {
  if (items.length === 0) throw new GuestOrderError("EMPTY_CART");

  const tableSession = await prisma.tableSession.findFirst({
    where: { userId, status: "CONFIRMED" },
    orderBy: { confirmedAt: "desc" },
  });
  if (!tableSession) throw new GuestOrderError("NO_ACTIVE_TABLE_SESSION");

  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: items.map((item) => item.menuItemId) } } });
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

  for (const item of items) {
    const menuItem = menuItemById.get(item.menuItemId);
    if (!menuItem) throw new GuestOrderError("MENU_ITEM_NOT_FOUND");
    if (!menuItem.posExternalId || !menuItem.kind) throw new GuestOrderError("MENU_ITEM_NOT_ORDERABLE");
  }

  return prisma.guestOrderRequest.create({
    data: {
      tableSessionId: tableSession.id,
      items: {
        create: items.map((item) => {
          const menuItem = menuItemById.get(item.menuItemId)!;
          return {
            menuItemId: item.menuItemId,
            name: menuItem.name,
            price: menuItem.price,
            quantity: item.quantity,
            comment: item.comment?.trim() || null,
          };
        }),
      },
    },
    include: { items: true },
  });
}

// Pull-бік для каси (app/api/pos/guest-order-requests) — лише PENDING, лише для столу, чия
// сесія й досі CONFIRMED (якщо гість пішов і сесію закрили/відхилили, стара заявка більше не
// актуальна для нового відвідувача цього ж столу).
export async function getPendingOrderRequestsForTable(tableCode: string) {
  return prisma.guestOrderRequest.findMany({
    where: { status: "PENDING", tableSession: { tableCode, status: "CONFIRMED" } },
    include: { items: { include: { menuItem: { select: { posExternalId: true, kind: true } } } } },
    orderBy: { createdAt: "asc" },
  });
}

// Idempotent: updateMany з where status=PENDING означає, що повторний виклик (ретрай доставки
// з боку каси) для вже вирішеної заявки просто нічого не робить, а не падає/дублює ефект.
export async function resolveGuestOrderRequest(id: string, status: "IMPORTED" | "REJECTED"): Promise<void> {
  await prisma.guestOrderRequest.updateMany({
    where: { id, status: "PENDING" },
    data: { status, resolvedAt: new Date() },
  });
}
