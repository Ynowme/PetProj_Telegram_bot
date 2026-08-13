import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { upsertMenuItem, removeMenuItem } from "@/lib/menu-sync";

const RUN_ID = Date.now();
const categoryIds: string[] = [];
const itemExternalIds: string[] = [];

afterAll(async () => {
  await prisma.menuItem.deleteMany({ where: { posExternalId: { in: itemExternalIds } } });
  await prisma.menuCategory.deleteMany({ where: { id: { in: categoryIds } } });
});

async function trackCategory(posExternalId: string) {
  const category = await prisma.menuCategory.findUniqueOrThrow({ where: { posExternalId } });
  categoryIds.push(category.id);
  return category;
}

describe("upsertMenuItem: приймання push-подій від CastaPOS (lib/site-sync.ts)", () => {
  it("створює категорію і позицію за posExternalId", async () => {
    const itemExternalId = `item-${RUN_ID}-a`;
    const categoryExternalId = `cat-${RUN_ID}-a`;
    itemExternalIds.push(itemExternalId);

    await upsertMenuItem({
      itemExternalId,
      kind: "product",
      name: "Капучино",
      price: 85,
      photoUrl: null,
      category: { externalId: categoryExternalId, name: `Кава ${RUN_ID}`, order: 0, parent: null },
    });
    await trackCategory(categoryExternalId);

    const item = await prisma.menuItem.findUnique({ where: { posExternalId: itemExternalId }, include: { category: true } });
    expect(item?.name).toBe("Капучино");
    expect(Number(item?.price)).toBe(85);
    expect(item?.category.posExternalId).toBe(categoryExternalId);
    expect(item?.category.slug).toBeTruthy();
  });

  it("повторний виклик з тим самим itemExternalId оновлює позицію, а не дублює", async () => {
    const itemExternalId = `item-${RUN_ID}-b`;
    const categoryExternalId = `cat-${RUN_ID}-b`;
    itemExternalIds.push(itemExternalId);

    const payload = {
      itemExternalId,
      kind: "recipe" as const,
      name: "Мохіто",
      price: 180,
      photoUrl: null,
      category: { externalId: categoryExternalId, name: `Бар ${RUN_ID}`, order: 1, parent: null },
    };
    await upsertMenuItem(payload);
    await upsertMenuItem({ ...payload, name: "Мохіто класичний", price: 190 });
    await trackCategory(categoryExternalId);

    const count = await prisma.menuItem.count({ where: { posExternalId: itemExternalId } });
    expect(count).toBe(1);

    const item = await prisma.menuItem.findUnique({ where: { posExternalId: itemExternalId } });
    expect(item?.name).toBe("Мохіто класичний");
    expect(Number(item?.price)).toBe(190);
  });

  it("повторний sync категорії не змінює її slug (стабільні /menu/[categorySlug] посилання)", async () => {
    const itemExternalId = `item-${RUN_ID}-c`;
    const categoryExternalId = `cat-${RUN_ID}-c`;
    itemExternalIds.push(itemExternalId);

    await upsertMenuItem({
      itemExternalId,
      kind: "product",
      name: "Матча",
      price: 95,
      photoUrl: null,
      category: { externalId: categoryExternalId, name: `Чай ${RUN_ID}`, order: 0, parent: null },
    });
    const first = await trackCategory(categoryExternalId);

    await upsertMenuItem({
      itemExternalId,
      kind: "product",
      name: "Матча",
      price: 95,
      photoUrl: null,
      category: { externalId: categoryExternalId, name: `Чай (перейменовано) ${RUN_ID}`, order: 0, parent: null },
    });

    const second = await prisma.menuCategory.findUniqueOrThrow({ where: { posExternalId: categoryExternalId } });
    expect(second.slug).toBe(first.slug);
    expect(second.name).toBe(`Чай (перейменовано) ${RUN_ID}`);
  });

  it("вкладена категорія (parent) створюється разом з дочірньою", async () => {
    const itemExternalId = `item-${RUN_ID}-d`;
    const parentExternalId = `cat-${RUN_ID}-parent`;
    const childExternalId = `cat-${RUN_ID}-child`;
    itemExternalIds.push(itemExternalId);

    await upsertMenuItem({
      itemExternalId,
      kind: "product",
      name: "Еспресо",
      price: 60,
      photoUrl: null,
      category: {
        externalId: childExternalId,
        name: `Гаряче ${RUN_ID}`,
        order: 0,
        parent: { externalId: parentExternalId, name: `Кава ${RUN_ID}`, order: 0 },
      },
    });
    const child = await trackCategory(childExternalId);
    const parent = await trackCategory(parentExternalId);

    expect(child.parentId).toBe(parent.id);
  });
});

describe("removeMenuItem: ідемпотентне знаття з вітрини", () => {
  it("видаляє позицію за posExternalId і не падає при повторному виклику", async () => {
    const itemExternalId = `item-${RUN_ID}-remove`;
    const categoryExternalId = `cat-${RUN_ID}-remove`;
    itemExternalIds.push(itemExternalId);

    await upsertMenuItem({
      itemExternalId,
      kind: "product",
      name: "Тимчасова позиція",
      price: 50,
      photoUrl: null,
      category: { externalId: categoryExternalId, name: `Тимчасова ${RUN_ID}`, order: 0, parent: null },
    });
    await trackCategory(categoryExternalId);

    await removeMenuItem(itemExternalId);
    expect(await prisma.menuItem.findUnique({ where: { posExternalId: itemExternalId } })).toBeNull();

    await expect(removeMenuItem(itemExternalId)).resolves.not.toThrow();
  });
});
