import { NextRequest, NextResponse } from "next/server";
import { verifySecretToken } from "@/lib/webhook-security";
import { resolveGuestOrderRequest } from "@/lib/guest-orders";

type ResolveBody = { status: "IMPORTED" | "REJECTED" };

function isValidBody(value: unknown): value is ResolveBody {
  if (!value || typeof value !== "object") return false;
  const status = (value as Record<string, unknown>).status;
  return status === "IMPORTED" || status === "REJECTED";
}

// Каса викликає це після того, як офіціант підтвердив (кожна позиція вже додана в чек через
// addItemToOrder) чи відхилив заявку в OrderScreen.tsx — той самий секрет-заголовок, що GET
// поруч (app/api/pos/guest-order-requests/route.ts).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = request.headers.get("x-pos-secret");
  if (!verifySecretToken(secret, process.env.POS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isValidBody(body)) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  }

  await resolveGuestOrderRequest(id, body.status);
  return NextResponse.json({ ok: true });
}
