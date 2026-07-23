import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FR-007, FR-016: история чеков; пусто при первом входе — без ошибки.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
      { status: 401 },
    );
  }

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
