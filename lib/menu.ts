import type { MenuItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const POPULAR_LIMIT = 10;

// FR-021: топ-N позиций по количеству лайков.
export function getPopularMenuItems() {
  return prisma.menuItem.findMany({
    include: { _count: { select: { likes: true } } },
    orderBy: { likes: { _count: "desc" } },
    take: POPULAR_LIMIT,
  });
}

// FR-001: двухуровневая структура категорий/подкатегорий.
export function getMenuCategories() {
  return prisma.menuCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: { children: { orderBy: { order: "asc" } } },
  });
}

type MenuItemWithLikeCount = MenuItem & { _count: { likes: number } };

export function serializeMenuItem(item: MenuItemWithLikeCount) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    currency: item.currency,
    photoUrl: item.photoUrl,
    volume: item.volume,
    abv: item.abv !== null ? Number(item.abv) : null,
    likesCount: item._count.likes,
  };
}

export type SerializedMenuItem = ReturnType<typeof serializeMenuItem>;
