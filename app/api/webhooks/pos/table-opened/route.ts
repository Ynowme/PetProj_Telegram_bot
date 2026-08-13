import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
    try {
      await prisma.posOrder.create({ data: { tableId: table.id, status: "OPEN" } });
    } catch (error) {
      // PosOrder_single_open_per_table_key (частковий унікальний індекс, той самий прийом, що
      // CastaPOS lib/orders.ts:openOrder) — паралельна/повторна доставка цього ж вебхука вже
      // встигла створити рядок між findFirst і цим create; переможець гонки вже зробив свою
      // справу, нам більше нічого робити не треба.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }

  return NextResponse.json({ ok: true });
}
