import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";

const SEARCH_RESULT_LIMIT = 60;
const TRIGRAM_SIMILARITY_THRESHOLD = 0.15;

const menuItemInclude = { _count: { select: { likes: true } } } as const;

// FR-002, FR-003, FR-019: список позиций по (под)категории и/или поисковому запросу.
// Пустая категория/поиск без совпадений — 200 с пустым массивом (Edge Cases в spec.md),
// а не 404.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search")?.trim();

  if (!search) {
    const items = await prisma.menuItem.findMany({
      where: categoryId ? { categoryId } : {},
      include: menuItemInclude,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ items: items.map(serializeMenuItem) });
  }

  // Три уровня релевантности: сперва точные совпадения по названию, затем по
  // описанию, и только затем нечёткие совпадения по 3-граммам (pg_trgm) — для
  // опечаток и близких по написанию слов. Каждый следующий уровень исключает
  // id, уже найденные на предыдущих, и результаты не перемешиваются между собой.
  const byName = await prisma.menuItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      name: { contains: search, mode: "insensitive" },
    },
    include: menuItemInclude,
    orderBy: { createdAt: "asc" },
  });

  const foundIds = new Set(byName.map((item) => item.id));
  let results = byName;

  if (foundIds.size < SEARCH_RESULT_LIMIT) {
    const byDescription = await prisma.menuItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        id: { notIn: [...foundIds] },
        description: { contains: search, mode: "insensitive" },
      },
      include: menuItemInclude,
      orderBy: { createdAt: "asc" },
      take: SEARCH_RESULT_LIMIT - foundIds.size,
    });
    byDescription.forEach((item) => foundIds.add(item.id));
    results = results.concat(byDescription);
  }

  if (foundIds.size < SEARCH_RESULT_LIMIT) {
    const excludeIds = [...foundIds];
    const trigramMatches = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT "id"
        FROM "MenuItem"
        WHERE similarity("name" || ' ' || "description", ${search}) > ${TRIGRAM_SIMILARITY_THRESHOLD}
          ${categoryId ? Prisma.sql`AND "categoryId" = ${categoryId}` : Prisma.empty}
          ${excludeIds.length > 0 ? Prisma.sql`AND "id" NOT IN (${Prisma.join(excludeIds)})` : Prisma.empty}
        ORDER BY similarity("name" || ' ' || "description", ${search}) DESC
        LIMIT ${SEARCH_RESULT_LIMIT - foundIds.size}
      `
    );

    if (trigramMatches.length > 0) {
      const trigramItems = await prisma.menuItem.findMany({
        where: { id: { in: trigramMatches.map((row) => row.id) } },
        include: menuItemInclude,
      });
      const itemById = new Map(trigramItems.map((item) => [item.id, item]));
      results = results.concat(
        trigramMatches
          .map((row) => itemById.get(row.id))
          .filter((item): item is (typeof trigramItems)[number] => item !== undefined)
      );
    }
  }

  return NextResponse.json({ items: results.map(serializeMenuItem) });
}
