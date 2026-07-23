import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";

const POPULAR_LIMIT = 10;

// FR-021: топ-10 позиций, отсортированных по количеству лайков.
export async function GET() {
  const items = await prisma.menuItem.findMany({
    include: { _count: { select: { likes: true } } },
    orderBy: { likes: { _count: "desc" } },
    take: POPULAR_LIMIT,
  });

  return NextResponse.json({ items: items.map(serializeMenuItem) });
}
