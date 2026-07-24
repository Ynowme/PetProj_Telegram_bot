// Разовый скрипт: импортирует реальное меню из экспорта прежнего сайта (JSON от shaketopay).
// Полностью заменяет текущие MenuCategory/MenuItem — запускать только осознанно.
// Запуск: npm run menu:import
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MENU_URL =
  "https://static.shaketopay.com.ua/menu/prod/cache/menu/0c6cbb04-4193-4d98-9c20-27505743356c/uk/menu.json";

// Прибрано з сайту (рішення власника, 2026-07-25) — при повторному імпорті не відновлювати.
const EXCLUDED_MENU_NAMES = new Set(["Добавки"]);

type SourceMenu = { id: number; name: string };
type SourceCategory = { id: number; name: string; menuId: number };
type SourceDishVariant = { unit?: string; amount?: number; price: number };
type SourceDish = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  categoryId: number;
  minPrice: number;
  dishVariants: SourceDishVariant[];
  active: boolean;
};
type SourceMenuJson = {
  emptyDishImage: string;
  menus: SourceMenu[];
  categories: SourceCategory[];
  dishes: SourceDish[];
};

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
};

function slugify(input: string): string {
  const transliterated = [...input.toLowerCase()].map((char) => TRANSLIT[char] ?? char).join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .trim();
}

async function main() {
  const response = await fetch(MENU_URL);
  if (!response.ok) throw new Error(`Failed to fetch menu JSON: ${response.status}`);
  const data = (await response.json()) as SourceMenuJson;

  console.log(`Source: ${data.menus.length} menus, ${data.categories.length} categories, ${data.dishes.length} dishes`);

  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});

  const usedSlugs = new Set<string>();
  function uniqueSlug(name: string): string {
    const base = slugify(name) || "item";
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    return slug;
  }

  const topLevelIdByMenuId = new Map<number, string>();
  for (const [index, menu] of data.menus.entries()) {
    if (EXCLUDED_MENU_NAMES.has(menu.name)) continue;
    const created = await prisma.menuCategory.create({
      data: { name: menu.name, slug: uniqueSlug(menu.name), parentId: null, order: index },
    });
    topLevelIdByMenuId.set(menu.id, created.id);
  }

  const subCategoryIdBySourceId = new Map<number, string>();
  for (const [index, category] of data.categories.entries()) {
    const parentId = topLevelIdByMenuId.get(category.menuId);
    if (!parentId) {
      console.warn(`Skipping category "${category.name}" — unknown menuId ${category.menuId}`);
      continue;
    }
    const created = await prisma.menuCategory.create({
      data: { name: category.name, slug: uniqueSlug(category.name), parentId, order: index },
    });
    subCategoryIdBySourceId.set(category.id, created.id);
  }

  let created = 0;
  let skipped = 0;
  for (const dish of data.dishes) {
    const categoryId = subCategoryIdBySourceId.get(dish.categoryId);
    if (!categoryId) {
      console.warn(`Skipping dish "${dish.title}" — unknown categoryId ${dish.categoryId}`);
      skipped += 1;
      continue;
    }

    const firstVariant = dish.dishVariants[0];
    const volume = firstVariant?.unit && firstVariant?.amount ? `${firstVariant.amount} ${firstVariant.unit}` : "";

    await prisma.menuItem.create({
      data: {
        categoryId,
        name: dish.title.trim(),
        description: stripHtml(dish.description),
        price: dish.minPrice,
        currency: "UAH",
        photoUrl: dish.imageUrl || data.emptyDishImage,
        volume,
        abv: null,
      },
    });
    created += 1;
  }

  console.log(`Imported ${created} dishes (${skipped} skipped).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
