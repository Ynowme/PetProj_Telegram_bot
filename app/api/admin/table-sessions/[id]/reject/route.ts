import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

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

  const rejected = await prisma.tableSession.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  await writeAuditLog({
    action: "TABLE_SESSION_REJECTED",
    targetUserId: rejected.userId,
    actor: session!.user.id,
    metadata: { tableSessionId: rejected.id, tableCode: rejected.tableCode },
  });

  return NextResponse.json({ id: rejected.id, status: rejected.status });
}
