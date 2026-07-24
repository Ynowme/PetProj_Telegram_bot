import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { getBonusBalance, getBonusHistory } from "@/lib/bonuses";

// FR-010: текущий баланс (в валюте) + история начислений/списаний.
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

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
