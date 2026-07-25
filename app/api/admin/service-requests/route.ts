import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// Список запитів на послуги (бронювання столу / оренда кальяну), що очікують підтвердження.
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const pending = await prisma.serviceRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "asc" },
    take: 100,
    include: { user: { select: { id: true, name: true, telegramUsername: true, phone: true } } },
  });

  return NextResponse.json(
    pending.map((item) => ({
      id: item.id,
      type: item.type,
      tableCode: item.tableCode,
      comment: item.comment,
      requestedAt: item.requestedAt,
      guest: item.user,
    })),
  );
}
