import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBonusBalance, getBonusHistory } from "@/lib/bonuses";

// FR-010: текущий баланс (в валюте) + история начислений/списаний.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
      { status: 401 },
    );
  }

  const [balance, history] = await Promise.all([
    getBonusBalance(session.user.id),
    getBonusHistory(session.user.id),
  ]);

  return NextResponse.json({
    balance,
    currency: "UAH",
    history: history.map((h) => ({
      id: h.id,
      amount: Number(h.amount),
      reason: h.reason,
      createdAt: h.createdAt,
      receiptId: h.receiptId,
    })),
  });
}
