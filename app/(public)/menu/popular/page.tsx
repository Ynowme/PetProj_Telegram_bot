import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

const POPULAR_LIMIT = 10;

// FR-021: топ-10 позицій за кількістю лайків; пусто — без помилки.
export default async function PopularMenuPage() {
  const items = await prisma.menuItem.findMany({
    include: { _count: { select: { likes: true } } },
    orderBy: { likes: { _count: "desc" } },
    take: POPULAR_LIMIT,
  });

  return (
    <main>
      <Link href="/menu" className="back-link">
        ← Меню
      </Link>
      <h1>Популярне</h1>

      {items.length === 0 ? (
        <p className="text-muted">Поки що жодна позиція не має вподобань.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) => (
            <MenuItemCard key={item.id} item={serializeMenuItem(item)} />
          ))}
        </div>
      )}
    </main>
  );
}
