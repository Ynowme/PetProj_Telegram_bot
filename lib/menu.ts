import type { MenuItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const POPULAR_LIMIT = 10;
const NEW_ITEMS_LIMIT = 30;
const NEW_ITEM_DAYS = 30;
const BAR_CATEGORY_SLUG = "bar";

// Заглушка для позицій без реального фото (photoUrl: null у БД) — підставляється тут, у
// serializeMenuItem, а не зберігається в БД: тоді MenuItemCard завжди отримує рядок і показує
// назву позиції поверх заглушки. Джерела null: імпорт (scripts/import-menu.ts) чи sync з
// CastaPOS (lib/menu-sync.ts), коли товар ще без фото.
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

// Меню однієї безперервної сторінки (app/(public)/menu/page.tsx + MenuBrowser) зі
// scrollspy-навігацією: топ-категорія — або вітка з підкатегоріями, або лист із
// власними позиціями, ніколи не обидва одразу (те саме правило, що в getMenuCategories
// вище й раніше кодувалося в JSX app/(public)/menu/page.tsx).
export async function getMenuSections() {
  const itemsInclude = {
    include: { _count: { select: { likes: true } } },
    orderBy: { createdAt: "asc" as const },
  };

  const categories = await prisma.menuCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      items: itemsInclude,
      children: {
        orderBy: { order: "asc" },
        include: { items: itemsInclude },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    items: category.items.map(serializeMenuItem),
    children: category.children.map((child) => ({
      id: child.id,
      slug: child.slug,
      name: child.name,
      items: child.items.map(serializeMenuItem),
    })),
  }));
}

export type MenuSection = Awaited<ReturnType<typeof getMenuSections>>[number];

type MenuItemWithLikeCount = MenuItem & { _count: { likes: number } };

export function serializeMenuItem(item: MenuItemWithLikeCount) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    currency: item.currency,
    photoUrl: item.photoUrl ?? PLACEHOLDER_PHOTO_URL,
    volume: item.volume,
    abv: item.abv !== null ? Number(item.abv) : null,
    likesCount: item._count.likes,
    isNew: item.createdAt >= newItemCutoff(),
    // kind — синкається з CastaPOS (lib/menu-sync.ts), null для позицій, імпортованих напряму
    // в PetProj (scripts/import-menu.ts) без прив'язки до товару/тех.карти в касі. Каса не
    // зможе прийняти гостьову заявку на такі позиції назад, тож клієнт ховає їх з кошика.
    orderable: item.kind !== null,
  };
}

export type SerializedMenuItem = ReturnType<typeof serializeMenuItem>;
