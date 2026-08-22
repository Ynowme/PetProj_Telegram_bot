import Link from "next/link";
import { EmptyState } from "@heroui/react";
import { getFavoriteMenuItems } from "@/lib/favorites";
import { MenuItemCard } from "@/components/MenuItemCard";

// Анонімне "Обрані" — ті ж лайкнуті позиції, що на MenuItemLikeButton, тільки зібрані
// в окремий список за visitor_id-кукі (lib/favorites.ts), без потреби логінитись.
export default async function FavoritesPage() {
  const items = await getFavoriteMenuItems();

  return (
    <main className="min-w-0">
      <Link href="/menu" className="mb-4 inline-flex min-h-11 items-center text-sm text-muted transition hover:text-foreground">
        ← Меню
      </Link>
      <h1 className="mb-5 mt-0 text-3xl font-semibold tracking-tight text-foreground">Обрані</h1>

      {items.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border py-10 text-center">
          Ви ще нічого не вподобали. Натисніть ♡ на картці позиції.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
