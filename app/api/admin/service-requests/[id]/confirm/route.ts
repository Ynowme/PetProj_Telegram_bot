import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!serviceRequest) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Запит не знайдено" } }, { status: 404 });
  }
  if (serviceRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: { code: "INVALID_STATE", message: "Запит уже оброблено" } },
      { status: 409 },
    );
  }

  const confirmed = await prisma.serviceRequest.update({
    where: { id },
    data: { status: "CONFIRMED", handledAt: new Date(), handledByStaffId: session!.user.id },
  });

  await writeAuditLog({
    action: "SERVICE_REQUEST_CONFIRMED",
    targetUserId: confirmed.userId,
    actor: session!.user.id,
    metadata: { serviceRequestId: confirmed.id, type: confirmed.type },
  });

  return NextResponse.json({ id: confirmed.id, status: confirmed.status });
}
