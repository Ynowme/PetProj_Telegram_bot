import { prisma } from "@/lib/prisma";
import { recomputeGoldStatus, currentCalendarMonth } from "@/lib/roles";
import { getBonusPercentage } from "@/lib/bonus-settings";
import { writeAuditLog } from "@/lib/audit-log";
import { normalizePhone } from "@/lib/request-security";

export type PosReceiptItemInput = { name: string; price: number; quantity: number };

// Рівно одне з двох — гостя визначено або через активну сесію столу (веб/Telegram-флоу),
// або (CastaPOS: коли гість не лінкував стіл через сайт) через його телефон, той самий
// пошук, що й у /api/admin/receipts для ручного внесення чека.
export type PosReceiptPayload = {
  posExternalId: string;
  tableSessionId?: string;
  guestPhone?: string;
  date: string;
  totalAmount: number;
  items: PosReceiptItemInput[];
};

export class ReceiptImportError extends Error {
  constructor(public code: "TABLE_SESSION_NOT_CONFIRMED" | "RECEIPT_NOT_FOUND" | "GUEST_NOT_FOUND") {
    super(code);
  }
}

/**
 * Импортирует чек, пришедший от POS по подтверждённой сессии стола или по телефону гостя
 * (FR-004…FR-006, FR-014). Идемпотентна по posExternalId (FR-015, SC-006) — повторная доставка
 * не создаёт дубликат. Чеки с суммой <= 0 не учитываются в подсчёте Gold и не порождают cashback
 * (Edge Case).
 */
export async function importPosReceipt(
  payload: PosReceiptPayload,
): Promise<{ receiptId: string; duplicate: boolean }> {
  const existing = await prisma.receipt.findUnique({ where: { posExternalId: payload.posExternalId } });
  if (existing) return { receiptId: existing.id, duplicate: true };

  let userId: string;
  let tableSessionId: string | null = null;

  if (payload.tableSessionId) {
    const tableSession = await prisma.tableSession.findUnique({ where: { id: payload.tableSessionId } });
    if (!tableSession || tableSession.status !== "CONFIRMED") {
      throw new ReceiptImportError("TABLE_SESSION_NOT_CONFIRMED");
    }
    userId = tableSession.userId;
    tableSessionId = tableSession.id;
  } else {
    const phone = normalizePhone(payload.guestPhone ?? "");
    const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
    if (!user) throw new ReceiptImportError("GUEST_NOT_FOUND");
    userId = user.id;
  }

  const month = currentCalendarMonth(new Date(payload.date));
  const countsTowardGoldMonth = payload.totalAmount > 0 ? month : null;

  const receipt = await prisma.receipt.create({
    data: {
      userId,
      date: new Date(payload.date),
      totalAmount: payload.totalAmount,
      source: "POS_IMPORT",
      status: "CONFIRMED",
      posExternalId: payload.posExternalId,
      tableSessionId,
      countsTowardGoldMonth,
      items: { create: payload.items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })) },
    },
  });

  // countsTowardGoldMonth пустой ровно когда totalAmount <= 0 — в этом случае accrueCashbackIfGold
  // всё равно выходит раньше, чем понадобится role, так что здесь она гарантированно определена.
  const role = countsTowardGoldMonth ? await recomputeGoldStatus(userId, month) : undefined;

  await accrueCashbackIfGold(userId, receipt.id, payload.totalAmount, role);

  return { receiptId: receipt.id, duplicate: false };
}

async function accrueCashbackIfGold(
  userId: string,
  receiptId: string,
  totalAmount: number,
  role: "MEMBER" | "GOLD_MEMBER" | undefined,
): Promise<void> {
  if (totalAmount <= 0) return;
  if (role !== "GOLD_MEMBER") return;

  const percentage = await getBonusPercentage();
  const bonusAmount = Math.round(totalAmount * (percentage / 100) * 100) / 100;

  // Идемпотентно: @@unique([receiptId, type]) не даёт начислить дважды за один чек.
  await prisma.bonusTransaction.upsert({
    where: { receiptId_type: { receiptId, type: "ACCRUAL" } },
    update: {},
    create: {
      userId,
      amount: bonusAmount,
      reason: `Cashback ${percentage}% (Gold Member) за чек`,
      type: "ACCRUAL",
      receiptId,
    },
  });
}

/**
 * Обрабатывает возврат/отмену чека: полная сторно-запись cashback, без пропорционального
 * пересчёта (решено 2026-07-23). Идемпотентна — повторная доставка события не сторнирует дважды.
 */
export async function refundPosReceipt(posExternalId: string): Promise<{ refunded: boolean }> {
  const receipt = await prisma.receipt.findUnique({ where: { posExternalId } });
  if (!receipt) throw new ReceiptImportError("RECEIPT_NOT_FOUND");

  if (receipt.status !== "REFUNDED") {
    await prisma.receipt.update({ where: { id: receipt.id }, data: { status: "REFUNDED" } });
  }

  const accrual = await prisma.bonusTransaction.findUnique({
    where: { receiptId_type: { receiptId: receipt.id, type: "ACCRUAL" } },
  });
  if (!accrual) return { refunded: true };

  const alreadyReversed = await prisma.bonusTransaction.findUnique({
    where: { receiptId_type: { receiptId: receipt.id, type: "REVERSAL" } },
  });
  if (alreadyReversed) return { refunded: true };

  await prisma.bonusTransaction.create({
    data: {
      userId: accrual.userId,
      amount: -Number(accrual.amount),
      reason: "Сторно cashback за поверненим/скасованим чеком",
      type: "REVERSAL",
      receiptId: receipt.id,
    },
  });

  await writeAuditLog({
    action: "CASHBACK_REVERSED",
    targetUserId: accrual.userId,
    actor: "POS_EVENT",
    metadata: { receiptId: receipt.id, reversedAmount: Number(accrual.amount) },
  });

  return { refunded: true };
}
