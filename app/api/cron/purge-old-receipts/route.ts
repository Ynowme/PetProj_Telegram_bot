import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySecretToken } from "@/lib/webhook-security";

const RETENTION_MONTHS = 3;

// Планова задача (vercel.json, "crons"): чеки старіші за 3 місяці видаляються фізично
// (FR: "Історія чеків" зберігається 3 місяці). Vercel сам додає заголовок
// Authorization: Bearer $CRON_SECRET при виклику за розкладом — тут лише звіряємо його.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!verifySecretToken(provided, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);

  const { count } = await prisma.receipt.deleteMany({ where: { date: { lt: cutoff } } });

  return NextResponse.json({ ok: true, deleted: count, cutoff });
}
