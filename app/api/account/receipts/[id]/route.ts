import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FR-007, FR-011: полный состав чека; чужой чек — 404 (не раскрываем факт существования).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
      { status: 401 },
    );
  }

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
