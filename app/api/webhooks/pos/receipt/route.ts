import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webhook-security";
import { importPosReceipt, refundPosReceipt, ReceiptImportError, type PosReceiptPayload } from "@/lib/receipt-import";

type ReceiptWebhookBody = PosReceiptPayload & { event: "RECEIPT_CONFIRMED" | "RECEIPT_REFUNDED" };

function isValidPayload(value: unknown): value is ReceiptWebhookBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.event !== "RECEIPT_CONFIRMED" && v.event !== "RECEIPT_REFUNDED") return false;
  if (typeof v.posExternalId !== "string" || v.posExternalId.length === 0) return false;

  if (v.event === "RECEIPT_REFUNDED") return true;

  return (
    typeof v.tableSessionId === "string" &&
    typeof v.date === "string" &&
    typeof v.totalAmount === "number" &&
    Number.isFinite(v.totalAmount) &&
    Array.isArray(v.items)
  );
}

// Webhook от PosProvider (сейчас fake, позже SkyServiceProvider — Промт 4). Подпись
// проверяется до разбора payload (FR-015). posExternalId — ключ идемпотентности.
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

  try {
    if (payload.event === "RECEIPT_REFUNDED") {
      const result = await refundPosReceipt(payload.posExternalId);
      return NextResponse.json(result);
    }

    const result = await importPosReceipt(payload);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    if (error instanceof ReceiptImportError) {
      const status = error.code === "RECEIPT_NOT_FOUND" ? 404 : 409;
      return NextResponse.json({ error: { code: error.code } }, { status });
    }
    throw error;
  }
}
