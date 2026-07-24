import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// FR-007, FR-016: история чеков; пусто при первом входе — без ошибки.
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({
    receipts: receipts.map((r) => ({
      id: r.id,
      date: r.date,
      totalAmount: Number(r.totalAmount),
      currency: r.currency,
    })),
  });
}
