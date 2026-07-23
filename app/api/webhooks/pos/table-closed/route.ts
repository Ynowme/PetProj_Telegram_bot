import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webhook-security";
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
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(rawBody, signature, process.env.POS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE" } }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 });
  }
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 });
  }

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
