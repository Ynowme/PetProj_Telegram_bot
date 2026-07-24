import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// FR-007, FR-011: полный состав чека; чужой чек — 404 (не раскрываем факт существования).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({ where: { id }, include: { items: true } });

  if (!receipt || receipt.userId !== session.user.id) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Чек не знайдено" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: receipt.id,
    date: receipt.date,
    totalAmount: Number(receipt.totalAmount),
    currency: receipt.currency,
    items: receipt.items.map((item) => ({
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
  });
}
