import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

// FR-007: Gold Member присваивается автоматически и бессрочно при >=7 подтверждённых
// чеках из POS за один календарный месяц. Понижение обратно до Member не выполняется.
export const GOLD_THRESHOLD = 7;

export function currentCalendarMonth(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Пересчитывает роль гостя на основе числа подтверждённых POS-чеков за указанный
 * календарный месяц. Не понижает уже присвоенный Gold. Идемпотентна: повторный вызов
 * для уже-Gold гостя не создаёт повторную запись audit log.
 */
// Возвращает роль гостя после пересчёта — вызывающая сторона (accrueCashbackIfGold) использует
// её напрямую вместо повторного запроса, в том числе когда апгрейд до Gold произошёл только что.
export async function recomputeGoldStatus(userId: string, month: string): Promise<"MEMBER" | "GOLD_MEMBER"> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role === "GOLD_MEMBER") return user?.role ?? "MEMBER";

  const confirmedCount = await prisma.receipt.count({
    where: {
      userId,
      source: "POS_IMPORT",
      status: "CONFIRMED",
      countsTowardGoldMonth: month,
    },
  });

  if (confirmedCount < GOLD_THRESHOLD) return user.role;

  await prisma.user.update({
    where: { id: userId },
    data: { role: "GOLD_MEMBER", goldSinceMonth: month },
  });

  await writeAuditLog({
    action: "ROLE_CHANGED",
    targetUserId: userId,
    actor: "SYSTEM",
    metadata: { newRole: "GOLD_MEMBER", month, confirmedCount },
  });

  return "GOLD_MEMBER";
}
