import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FR-020: лайк доступен анонимно, повторное нажатие снимает лайк (toggle).
// Защита от накрутки — cookie visitor_id + уникальное ограничение в БД (research.md, п.7).
const VISITOR_COOKIE = "visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: menuItemId } = await params;

  const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menuItem) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Позицію меню не знайдено" } },
      { status: 404 },
    );
  }

  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? randomUUID();

  const existingLike = await prisma.menuItemLike.findUnique({
    where: { menuItemId_visitorId: { menuItemId, visitorId } },
  });

  let liked: boolean;
  if (existingLike) {
    await prisma.menuItemLike.delete({ where: { id: existingLike.id } });
    liked = false;
  } else {
    await prisma.menuItemLike.create({ data: { menuItemId, visitorId } });
    liked = true;
  }

  const likesCount = await prisma.menuItemLike.count({ where: { menuItemId } });

  const response = NextResponse.json({ liked, likesCount });
  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
    });
  }
  return response;
}
