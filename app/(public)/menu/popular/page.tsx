import Link from "next/link";
import { EmptyState } from "@heroui/react";
import { getPopularMenuItems, serializeMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

// FR-021: топ-10 позицій за кількістю лайків; пусто — без помилки.
export default async function PopularMenuPage() {
  const items = await getPopularMenuItems();

  return (
    <main className="min-w-0">
      <Link href="/menu" className="mb-4 inline-flex min-h-11 items-center text-sm text-muted transition hover:text-foreground">
        ← Меню
      </Link>
      <h1 className="mb-5 mt-0 text-3xl font-semibold tracking-tight text-foreground">Популярне</h1>

      {items.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border py-10 text-center">
          Поки що жодна позиція не має вподобань.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={serializeMenuItem(item)} />
          ))}
        </div>
      )}
    </main>
  );
}
