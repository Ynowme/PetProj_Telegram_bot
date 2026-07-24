import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { prisma } from "@/lib/prisma";

type TableClosedBody = { tableCode: string };

function isValidPayload(value: unknown): value is TableClosedBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.tableCode === "string" && v.tableCode.length > 0;
}

// FR-006: после закрытия стола в POS новые привязки к этой сессии недопустимы.
// Идемпотентна — повторная доставка события не меняет уже закрытую сессию.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  const active = await prisma.tableSession.findFirst({
    where: { tableCode: payload.tableCode, status: { in: ["PENDING_STAFF_CONFIRMATION", "CONFIRMED"] } },
  });
  if (!active) return NextResponse.json({ closed: false });

  await prisma.tableSession.update({
    where: { id: active.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  return NextResponse.json({ closed: true });
}
