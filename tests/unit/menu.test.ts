import { describe, expect, it } from "vitest";
import type { MenuItem } from "@prisma/client";
import { serializeMenuItem } from "@/lib/menu";

function makeItem(overrides: Partial<MenuItem> = {}) {
  return {
    id: "item_1",
    categoryId: "cat_1",
    name: "Мохіто",
    description: "М'ята, лайм, ром, содова.",
    price: 190,
    currency: "UAH",
    photoUrl: "https://example.com/photo.jpg",
    volume: "300 мл",
    abv: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as MenuItem;
}

describe("serializeMenuItem", () => {
  it("converts Decimal-like price/abv fields to numbers and includes likesCount", () => {
    const serialized = serializeMenuItem({ ...makeItem({ abv: 12.5 }), _count: { likes: 4 } });

    expect(serialized).toEqual({
      id: "item_1",
      categoryId: "cat_1",
      name: "Мохіто",
      description: "М'ята, лайм, ром, содова.",
      price: 190,
      currency: "UAH",
      photoUrl: "https://example.com/photo.jpg",
      volume: "300 мл",
      abv: 12.5,
      likesCount: 4,
    });
  });

  it("keeps abv as null for non-alcoholic items", () => {
    const serialized = serializeMenuItem({ ...makeItem(), _count: { likes: 0 } });
    expect(serialized.abv).toBeNull();
    expect(serialized.likesCount).toBe(0);
  });
});
