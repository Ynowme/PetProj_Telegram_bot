import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { posProvider } from "@/lib/pos";
import { writeAuditLog } from "@/lib/audit-log";

// FR-005: сотрудник подтверждает привязку. Сервер повторно проверяет, что стол всё ещё
// открыт в POS непосредственно перед подтверждением (защита от TOCTOU — стол мог закрыться
// между запросом гостя и подтверждением официанта).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const tableSession = await prisma.tableSession.findUnique({ where: { id } });
  if (!tableSession) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Запит не знайдено" } },
      { status: 404 },
    );
  }
  if (tableSession.status !== "PENDING_STAFF_CONFIRMATION") {
    return NextResponse.json(
      { error: { code: "INVALID_STATE", message: "Запит уже оброблено" } },
      { status: 409 },
    );
  }

  const tableStatus = await posProvider.isTableOpen(tableSession.tableCode);
  if (!tableStatus.open) {
    return NextResponse.json(
      { error: { code: "TABLE_NOT_OPEN", message: "Стіл уже не відкритий у POS" } },
      { status: 409 },
    );
  }

  const confirmed = await prisma.tableSession.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      confirmedByStaffId: session!.user.id,
      posTableExternalId: tableStatus.posTableExternalId,
    },
  });

  await writeAuditLog({
    action: "TABLE_SESSION_CONFIRMED",
    targetUserId: confirmed.userId,
    actor: session!.user.id,
    metadata: { tableSessionId: confirmed.id, tableCode: confirmed.tableCode },
  });

  return NextResponse.json({ id: confirmed.id, status: confirmed.status });
}
