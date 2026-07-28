import { prisma } from "@/lib/prisma";
import type { PosProvider } from "@/lib/pos/provider";

// Реальний PosProvider для CastaPOS (окремий репозиторій, спільна Neon-база — Промт 4).
// CastaPOS сам пише в PosTable/PosOrder напряму; тут ми лише читаємо той самий стан, без
// HTTP-виклику до CastaPOS (сенс спільної БД саме в цьому). "Стіл зайнятий" ⇔ є PosOrder
// зі статусом OPEN для цього tableCode. posTableExternalId — id відповідного PosOrder,
// зберігається на TableSession так само, як раніше зберігався id з fake-провайдера.
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
