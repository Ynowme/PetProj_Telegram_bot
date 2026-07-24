import Link from "next/link";
import { getPopularMenuItems, serializeMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

// FR-021: топ-10 позицій за кількістю лайків; пусто — без помилки.
export default async function PopularMenuPage() {
  const items = await getPopularMenuItems();

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
