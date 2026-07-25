import type { MenuItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const POPULAR_LIMIT = 10;
const NEW_ITEMS_LIMIT = 30;
const NEW_ITEM_DAYS = 30;
const BAR_CATEGORY_SLUG = "bar";

// Заглушка з імпорту меню (scripts/import-menu.ts) — позиції без реального фото отримують
// саме цей URL. Використовується, щоб показати назву позиції поверх заглушки (MenuItemCard).
export const PLACEHOLDER_PHOTO_URL = "https://static.shaketopay.com.ua/menu-prod/default-dish.png";

export function newItemCutoff(): Date {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - NEW_ITEM_DAYS);
  return cutoff;
}

// FR-021: топ-10 позицій за лайками — тільки з розділу "Бар" (напої), плюс усі позиції
// цього розділу, додані за останній місяць (понад ліміт, позначаються плашкою "Новинка").
export async function getPopularMenuItems() {
  const barCategory = await prisma.menuCategory.findFirst({
    where: { parentId: null, slug: BAR_CATEGORY_SLUG },
  });
  if (!barCategory) return [];

  const whereBar = { category: { parentId: barCategory.id } };

  const [topLiked, newItems] = await Promise.all([
    prisma.menuItem.findMany({
      where: whereBar,
      include: { _count: { select: { likes: true } } },
      orderBy: { likes: { _count: "desc" } },
      take: POPULAR_LIMIT,
    }),
    prisma.menuItem.findMany({
      where: { ...whereBar, createdAt: { gte: newItemCutoff() } },
      include: { _count: { select: { likes: true } } },
      orderBy: { createdAt: "desc" },
      take: NEW_ITEMS_LIMIT,
    }),
  ]);

  const seenIds = new Set(topLiked.map((item) => item.id));
  return [...topLiked, ...newItems.filter((item) => !seenIds.has(item.id))];
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
    isNew: item.createdAt >= newItemCutoff(),
  };
}

export type SerializedMenuItem = ReturnType<typeof serializeMenuItem>;
