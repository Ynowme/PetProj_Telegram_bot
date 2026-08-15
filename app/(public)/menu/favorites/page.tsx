import Link from "next/link";
import { getFavoriteMenuItems } from "@/lib/favorites";
import { MenuItemCard } from "@/components/MenuItemCard";

// Анонімне "Обрані" — ті ж лайкнуті позиції, що на MenuItemLikeButton, тільки зібрані
// в окремий список за visitor_id-кукі (lib/favorites.ts), без потреби логінитись.
export default async function FavoritesPage() {
  const items = await getFavoriteMenuItems();

  return (
    <main>
      <Link href="/menu" className="back-link">
        ← Меню
      </Link>
      <h1>Обрані</h1>

      {items.length === 0 ? (
        <p className="text-muted">Ви ще нічого не вподобали — натисніть ♡ на картці позиції.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
