import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";

// Той самий httpOnly-кукі, що ставить POST /api/menu/items/[id]/like — гість без
// логіну впізнається по ньому, тож "Обрані" читаються так само анонімно, як і лайки.
const VISITOR_COOKIE = "visitor_id";

async function getVisitorId() {
  const store = await cookies();
  return store.get(VISITOR_COOKIE)?.value ?? null;
}

export async function getFavoriteCount() {
  const visitorId = await getVisitorId();
  if (!visitorId) return 0;
  return prisma.menuItemLike.count({ where: { visitorId } });
}

export async function getFavoriteMenuItems() {
  const visitorId = await getVisitorId();
  if (!visitorId) return [];

  const likes = await prisma.menuItemLike.findMany({
    where: { visitorId },
    orderBy: { createdAt: "desc" },
    include: { menuItem: { include: { _count: { select: { likes: true } } } } },
  });

  return likes.map((like) => serializeMenuItem(like.menuItem));
}
