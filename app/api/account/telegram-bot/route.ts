import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlinkTelegramBot, TelegramBotLinkError } from "@/lib/telegram-bot-link";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
  { status: 401 },
);

// Текущий статус привязки бота (не показываем сам факт наличия/отсутствия чеков и т.п.).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return UNAUTHORIZED;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramBotLinkedAt: true, phoneVerifiedAt: true, role: true, phone: true },
  });

  return NextResponse.json({
    linked: Boolean(user?.telegramBotLinkedAt),
    linkedAt: user?.telegramBotLinkedAt,
    phoneVerified: Boolean(user?.phoneVerifiedAt),
    isGoldMember: user?.role === "GOLD_MEMBER",
    hasPhone: Boolean(user?.phone),
  });
}

// FR-027: отвязка бота по инициативе гостя.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return UNAUTHORIZED;

  try {
    await unlinkTelegramBot(session.user.id);
    return NextResponse.json({ linked: false });
  } catch (error) {
    if (error instanceof TelegramBotLinkError && error.code === "NOT_LINKED") {
      return NextResponse.json({ error: { code: "NOT_LINKED", message: "Бот ще не привʼязаний" } }, { status: 409 });
    }
    throw error;
  }
}
