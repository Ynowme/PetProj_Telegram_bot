import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getBonusPercentage } from "@/lib/bonus-settings";
import { normalizePhone } from "@/lib/request-security";

type ReceiptItemInput = { name: string; price: number; quantity: number };

function isValidItem(item: unknown): item is ReceiptItemInput {
  if (!item || typeof item !== "object") return false;
  const { name, price, quantity } = item as Record<string, unknown>;
  return (
    typeof name === "string" &&
    name.trim().length > 0 &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    price > 0 &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}

// Ручне внесення чека персоналом (немає інтеграції з POS — research.md, п.8).
// Бонус нараховується автоматично за поточною ставкою (BonusSettings).
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as { phone?: string; items?: unknown };
  const phone = body.phone ? normalizePhone(body.phone) : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!phone || items.length === 0 || !items.every(isValidItem)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Вкажіть коректний телефон гостя та хоча б одну позицію чека (назва, ціна > 0, кількість > 0)",
        },
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json(
      { error: { code: "USER_NOT_FOUND", message: "Гостя з таким телефоном не знайдено — він має бути зареєстрований на сайті" } },
      { status: 404 },
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const percentage = await getBonusPercentage();
  const bonusAmount = Math.round(totalAmount * (percentage / 100) * 100) / 100;

  const receipt = await prisma.receipt.create({
    data: {
      userId: user.id,
      date: new Date(),
      totalAmount,
      items: { create: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })) },
    },
  });

  await prisma.bonusTransaction.create({
    data: {
      userId: user.id,
      amount: bonusAmount,
      reason: `Нарахування ${percentage}% за чек`,
      receiptId: receipt.id,
    },
  });

  return NextResponse.json(
    { id: receipt.id, totalAmount, bonusAmount, percentage },
    { status: 201 },
  );
}
