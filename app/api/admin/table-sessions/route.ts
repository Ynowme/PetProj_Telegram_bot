import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// Список запросов на привязку к столу, ожидающих подтверждения сотрудника (FR-005).
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const pending = await prisma.tableSession.findMany({
    where: { status: "PENDING_STAFF_CONFIRMATION" },
    orderBy: { requestedAt: "asc" },
    include: { user: { select: { id: true, name: true, telegramUsername: true, phone: true } } },
  });

  return NextResponse.json(
    pending.map((tableSession) => ({
      id: tableSession.id,
      tableCode: tableSession.tableCode,
      requestedAt: tableSession.requestedAt,
      guest: tableSession.user,
    })),
  );
}
