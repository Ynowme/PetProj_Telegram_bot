import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";

// FR-002, FR-003, FR-019: список позиций по (под)категории и/или поисковому запросу.
// Пустая категория/поиск без совпадений — 200 с пустым массивом (Edge Cases в spec.md),
// а не 404.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search")?.trim();

  const items = await prisma.menuItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { _count: { select: { likes: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ items: items.map(serializeMenuItem) });
}
