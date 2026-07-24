import type { SerializedMenuItem } from "@/lib/menu";
import { MenuItemLikeButton } from "@/components/MenuItemLikeButton";

export function MenuItemCard({ item }: { item: SerializedMenuItem }) {
  return (
    <article
      style={{
        display: "flex",
        gap: "1rem",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "1rem",
        background: "linear-gradient(145deg, rgba(29, 33, 40, 0.9), rgba(14, 16, 21, 0.9))",
        contentVisibility: "auto",
        containIntrinsicSize: "128px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- локальные/будущие S3-фото, next/image добавим при подключении реального ImageStorage-CDN */}
      <img
        src={item.photoUrl}
        alt={item.name}
        width={96}
        height={96}
        style={{ objectFit: "cover", borderRadius: 8, background: "var(--surface)" }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <h3 style={{ margin: 0 }}>{item.name}</h3>
          <strong>
            {item.price} {item.currency}
          </strong>
        </div>
        {item.description && <p style={{ margin: "0.4rem 0", opacity: 0.8 }}>{item.description}</p>}
        {(item.volume || item.abv !== null) && (
          <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.6 }}>
            {item.volume}
            {item.abv !== null ? ` · ${item.abv}%` : ""}
          </p>
        )}
        <div style={{ marginTop: "0.6rem" }}>
          <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
        </div>
      </div>
    </article>
  );
}
