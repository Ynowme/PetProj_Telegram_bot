import { PLACEHOLDER_PHOTO_URL, type SerializedMenuItem } from "@/lib/menu";
import { MenuItemLikeButton } from "@/components/MenuItemLikeButton";

export function MenuItemCard({ item }: { item: SerializedMenuItem }) {
  const hasNoPhoto = item.photoUrl === PLACEHOLDER_PHOTO_URL;

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
      <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- локальные/будущие S3-фото, next/image добавим при подключении реального ImageStorage-CDN */}
        <img
          src={item.photoUrl}
          alt={item.name}
          width={96}
          height={96}
          style={{ objectFit: "cover", borderRadius: 8, background: "var(--surface)" }}
        />
        {hasNoPhoto && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0.3rem",
              fontFamily: "var(--font-yeseva)",
              fontSize: "0.8rem",
              lineHeight: 1.1,
              color: "var(--accent-bright)",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
            }}
          >
            {item.name}
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {item.name}
            {item.isNew && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--accent-contrast)",
                  background: "var(--accent)",
                  borderRadius: 6,
                  padding: "0.1rem 0.4rem",
                }}
              >
                Новинка
              </span>
            )}
          </h3>
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
