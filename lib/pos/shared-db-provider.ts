import { prisma } from "@/lib/prisma";
import type { PosProvider } from "@/lib/pos/provider";

// Реальний PosProvider для CastaPOS (окремий репозиторій, живе на власному залізі бару — до
// нього не дотягнутись з Vercel). PosTable/PosOrder тут — НЕ спільна БД (той план не відбувся,
// CastaPOS отримав власну незалежну Postgres), а локальне дзеркало: CastaPOS штовхає стан push-
// вебхуками (POST /api/webhooks/pos/table-opened, table-closed, lib/site-sync.ts в тому
// репозиторії), ми лише читаємо те, що вони наповнили. "Стіл зайнятий" ⇔ є PosOrder зі статусом
// OPEN для цього tableCode. posTableExternalId — id відповідного PosOrder (нашого власного, не
// CastaPOS-івського), зберігається на TableSession так само, як раніше зберігався id з
// fake-провайдера.
export const sharedDbPosProvider: PosProvider = {
  async isTableOpen(tableCode: string) {
    const openOrder = await prisma.posOrder.findFirst({
      where: { status: "OPEN", table: { code: tableCode } },
      select: { id: true },
    });
    return openOrder ? { open: true, posTableExternalId: openOrder.id } : { open: false };
  },

  async listTables() {
    const tables = await prisma.posTable.findMany({
      select: { code: true, orders: { where: { status: "OPEN" }, select: { id: true }, take: 1 } },
    });
    return tables.map((table) => ({ tableCode: table.code, open: table.orders.length > 0 }));
  },
};
