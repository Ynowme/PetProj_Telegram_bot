import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { GOLD_THRESHOLD, currentCalendarMonth } from "@/lib/roles";

// Текущая роль гостя; для Member — прогресс до Gold в текущем календарном месяце.
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, goldSinceMonth: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Користувача не знайдено" } },
      { status: 404 },
    );
  }

  if (user.role === "GOLD_MEMBER") {
    return NextResponse.json({ role: user.role, goldSinceMonth: user.goldSinceMonth });
  }

  const month = currentCalendarMonth();
  const confirmedCount = await prisma.receipt.count({
    where: { userId: user.id, source: "POS_IMPORT", status: "CONFIRMED", countsTowardGoldMonth: month },
  });

  return NextResponse.json({
    role: user.role,
    confirmedReceiptsThisMonth: confirmedCount,
    receiptsUntilGold: Math.max(0, GOLD_THRESHOLD - confirmedCount),
  });
}
