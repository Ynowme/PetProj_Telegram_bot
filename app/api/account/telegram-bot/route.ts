import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { unlinkTelegramBot, TelegramBotLinkError } from "@/lib/telegram-bot-link";

// Текущий статус привязки бота (не показываем сам факт наличия/отсутствия чеков и т.п.).
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

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
  const { session, response } = await requireUser();
  if (response) return response;

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
