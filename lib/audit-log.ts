import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Не передавать сюда телефоны, токены или тела webhook-подписей — только идентификаторы
// и агрегированные факты (specs/002-member-gold-system, data-model.md).
export async function writeAuditLog(entry: {
  action: AuditAction;
  targetUserId: string;
  actor: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLogEntry.create({
    data: {
      action: entry.action,
      targetUserId: entry.targetUserId,
      actor: entry.actor,
      metadata: entry.metadata,
    },
  });
}
