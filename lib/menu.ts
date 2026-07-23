import type { MenuItem } from "@prisma/client";

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
