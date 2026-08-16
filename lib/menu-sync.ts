import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

// Приймає push-события від CastaPOS (lib/site-sync.ts в тому репозиторії) — товар/тех.карту з
// увімкненим "Показувати на сайті" в потрібну категорію меню. posExternalId — ключ ідемпотентності
// (CastaPOS Product/Recipe.id і Category.id відповідно), той самий підхід, що й Receipt.posExternalId
// в lib/receipt-import.ts.

export type MenuSyncCategoryPayload = {
  externalId: string;
  name: string;
  order: number;
  parent: { externalId: string; name: string; order: number } | null;
};

export type MenuSyncUpsertPayload = {
  itemExternalId: string;
  kind: "product" | "recipe";
  name: string;
  price: number;
  photoUrl: string | null;
  category: MenuSyncCategoryPayload;
};

async function uniqueSlugFor(name: string): Promise<string> {
  const base = slugify(name) || "item";
  let slug = base;
  let suffix = 2;
  // Каталог невеликий (десятки-сотні категорій) — послідовні запити тут прийнятні, sync
  // інкрементальний (по одній категорії), на відміну від пакетного scripts/import-menu.ts.
  while (await prisma.menuCategory.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

// Slug виставляється лише при СТВОРЕННІ категорії і більше не міняється навіть якщо назва в
// CastaPOS зміниться — /menu/[categorySlug] є реальним посиланням, яке гість міг зберегти в
// закладки, ламати його перейменуванням на боці POS не варто.
//
// uniqueSlugFor перевіряє зайнятість окремим запитом ДО create — між ними є вікно гонки (дві
// категорії з однаковою назвою, синхронізовані майже одночасно, можуть обидві побачити той самий
// вільний slug). Ретрай на P2002 замість pre-check-then-create покриває це: програвша спроба
// просто рахує наступний вільний slug наново.
async function upsertCategory(externalId: string, name: string, order: number, parentId: string | null): Promise<string> {
  const existing = await prisma.menuCategory.findUnique({ where: { posExternalId: externalId } });
  if (existing) {
    const updated = await prisma.menuCategory.update({ where: { id: existing.id }, data: { name, order, parentId } });
    return updated.id;
  }

  for (let attempt = 0; ; attempt++) {
    try {
      const created = await prisma.menuCategory.create({
        data: { name, order, parentId, posExternalId: externalId, slug: await uniqueSlugFor(name) },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 3) continue;
      throw error;
    }
  }
}

export async function upsertMenuItem(payload: MenuSyncUpsertPayload): Promise<void> {
  let parentId: string | null = null;
  if (payload.category.parent) {
    parentId = await upsertCategory(payload.category.parent.externalId, payload.category.parent.name, payload.category.parent.order, null);
  }
  const categoryId = await upsertCategory(payload.category.externalId, payload.category.name, payload.category.order, parentId);

  await prisma.menuItem.upsert({
    where: { posExternalId: payload.itemExternalId },
    update: { name: payload.name, price: payload.price, photoUrl: payload.photoUrl, categoryId, kind: payload.kind },
    create: {
      name: payload.name,
      price: payload.price,
      photoUrl: payload.photoUrl,
      categoryId,
      posExternalId: payload.itemExternalId,
      kind: payload.kind,
    },
  });
}

// Ідемпотентно — видалення вже видаленої/ніколи не існуючої позиції не помилка (той самий підхід,
// що й refundPosReceipt/table-closed вебхуки: повторна доставка не має побічних ефектів).
export async function removeMenuItem(itemExternalId: string): Promise<void> {
  await prisma.menuItem.deleteMany({ where: { posExternalId: itemExternalId } });
}
