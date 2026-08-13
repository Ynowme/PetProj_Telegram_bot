import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { prisma } from "@/lib/prisma";

type TableOpenedBody = { tableCode: string };

function isValidPayload(value: unknown): value is TableOpenedBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.tableCode === "string" && v.tableCode.length > 0;
}

// Симетрично table-closed: CastaPOS штовхає це, коли на столі відкривається замовлення. Наповнює
// дзеркальний PosTable/PosOrder (lib/pos/shared-db-provider.ts читає їх для isTableOpen/listTables)
// — без спільної БД з CastaPOS це єдиний спосіб сайту знати, який стіл зараз відкритий, коли гість
// сканує QR і запитує привязку (/api/account/table-session). Ідемпотентна.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  const table = await prisma.posTable.upsert({
    where: { code: payload.tableCode },
    update: {},
    create: { code: payload.tableCode },
  });

  const existingOpen = await prisma.posOrder.findFirst({ where: { tableId: table.id, status: "OPEN" } });
  if (!existingOpen) {
    await prisma.posOrder.create({ data: { tableId: table.id, status: "OPEN" } });
  }

  return NextResponse.json({ ok: true });
}
