"use client";

import { useEffect, useState } from "react";
import { PLACEHOLDER_PHOTO_URL, type SerializedMenuItem } from "@/lib/menu";
import { MenuItemLikeButton } from "@/components/MenuItemLikeButton";

function VolumeAbvLine({ item }: { item: SerializedMenuItem }) {
  if (!item.volume && item.abv === null) return null;
  return (
    <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.6 }}>
      {item.volume}
      {item.abv !== null ? ` · ${item.abv}%` : ""}
    </p>
  );
}

function NewBadge() {
  return (
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
  );
}

function PlaceholderNameOverlay({ name }: { name: string }) {
  return (
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
        color: "#000",
        textShadow: "0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.6)",
      }}
    >
      {name}
    </span>
  );
}

export function MenuItemCard({ item }: { item: SerializedMenuItem }) {
  const hasNoPhoto = item.photoUrl === PLACEHOLDER_PHOTO_URL;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
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
        <div
          role="button"
          tabIndex={0}
          aria-label={`Показати ${item.name} детальніше`}
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          style={{ position: "relative", width: 96, height: 96, flexShrink: 0, cursor: "pointer" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- локальные/будущие S3-фото, next/image добавим при подключении реального ImageStorage-CDN */}
          <img
            src={item.photoUrl}
            alt={item.name}
            width={96}
            height={96}
            style={{ objectFit: "cover", borderRadius: 8, background: "var(--surface)" }}
          />
          {hasNoPhoto && <PlaceholderNameOverlay name={item.name} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
                minWidth: 0,
                overflowWrap: "break-word",
              }}
            >
              {item.name}
              {item.isNew && <NewBadge />}
            </h3>
            <strong style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
              {item.price} {item.currency}
            </strong>
          </div>
          {item.description && <p style={{ margin: "0.4rem 0", opacity: 0.8 }}>{item.description}</p>}
          <VolumeAbvLine item={item} />
          <div style={{ marginTop: "0.6rem" }}>
            <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
          </div>
        </div>
      </article>

      {isOpen && (
        <div
          role="presentation"
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "min(420px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Закрити"
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontSize: "1.1rem",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- див. коментар вище */}
              <img
                src={item.photoUrl}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "16px 16px 0 0",
                  background: "var(--surface)",
                }}
              />
              {hasNoPhoto && <PlaceholderNameOverlay name={item.name} />}
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  {item.name}
                  {item.isNew && <NewBadge />}
                </h2>
                <strong style={{ flexShrink: 0, fontSize: "1.1rem", color: "var(--accent-bright)" }}>
                  {item.price} {item.currency}
                </strong>
              </div>
              {item.description && <p style={{ marginTop: "0.6rem", opacity: 0.85 }}>{item.description}</p>}
              <VolumeAbvLine item={item} />
              <div style={{ marginTop: "1rem" }}>
                <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
