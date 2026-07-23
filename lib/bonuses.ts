import { prisma } from "@/lib/prisma";

// Текущий бонусный баланс — вычисляемая сумма BonusTransaction, отдельного
// хранимого поля баланса нет (data-model.md → BonusTransaction), чтобы избежать
// рассинхронизации между балансом и историей операций.
export async function getBonusBalance(userId: string): Promise<number> {
  const result = await prisma.bonusTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
}

export async function getBonusHistory(userId: string) {
  return prisma.bonusTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
