"use client";

import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { PLACEHOLDER_PHOTO_URL, type SerializedMenuItem } from "@/lib/menu";
import { MenuItemLikeButton } from "@/components/MenuItemLikeButton";

const toggleLinkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  fontWeight: 600,
  color: "var(--accent-bright)",
  cursor: "pointer",
} as const;

// Опис у списку — обрізаний до 2 рядків з інлайновою кнопкою "показати" в кінці, щоб
// картки в списку були однакової висоти незалежно від довжини опису (на відміну від
// модалки з фото, де опис завжди показується повністю). Клас menu-card__description —
// щоб десктопна плитка (app/globals.css) могла його приховати через !important.
function DescriptionClamp({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <p className="menu-card__description" style={{ margin: "0.4rem 0", opacity: 0.8 }}>
        {text}{" "}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(false);
          }}
          style={toggleLinkStyle}
        >
          сховати
        </button>
      </p>
    );
  }

  return (
    <p
      className="menu-card__description"
      style={{
        margin: "0.4rem 0",
        opacity: 0.8,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {text}{" "}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded(true);
        }}
        style={toggleLinkStyle}
      >
        показати
      </button>
    </p>
  );
}

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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

// Поділитися позицією: нативний Web Share на мобільних (де він і найкорисніший),
// фолбек — скопіювати посилання на поточну сторінку меню в буфер обміну.
function ShareButton({ item }: { item: SerializedMenuItem }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (event: ReactMouseEvent) => {
    event.stopPropagation();
    if (typeof window === "undefined") return;

    const shareData = {
      title: item.name,
      text: `${item.name} — ${item.price} ${item.currency}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Користувач закрив діалог — це не помилка.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер обміну недоступний (напр. немає дозволу) — тихо ігноруємо.
    }
  };

  return (
    <button type="button" onClick={handleShare} aria-label={`Поділитися ${item.name}`} className="menu-card__share">
      {copied ? "✓" : <ShareIcon />}
    </button>
  );
}

export function MenuItemCard({ item }: { item: SerializedMenuItem }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const hasNoPhoto = item.photoUrl === PLACEHOLDER_PHOTO_URL || photoFailed;
  const photoSrc = photoFailed ? PLACEHOLDER_PHOTO_URL : item.photoUrl;
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
        role="button"
        tabIndex={0}
        aria-label={`Показати ${item.name} детальніше`}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event: ReactKeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className="menu-card"
      >
        <div className="menu-card__photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- локальные/будущие S3-фото, next/image добавим при подключении реального ImageStorage-CDN */}
          <img src={photoSrc} alt={item.name} onError={() => setPhotoFailed(true)} />
          {hasNoPhoto && <PlaceholderNameOverlay name={item.name} />}
        </div>
        <div className="menu-card__body">
          <div className="menu-card__heading">
            <h3 className="menu-card__name">
              {item.name}
              {item.isNew && <NewBadge />}
            </h3>
            <strong className="menu-card__price">
              {item.price} {item.currency}
            </strong>
          </div>
          {item.description && <DescriptionClamp text={item.description} />}
          <VolumeAbvLine item={item} />
          <div className="menu-card__actions" onClick={(event) => event.stopPropagation()}>
            <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
            <ShareButton item={item} />
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
                zIndex: 1,
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                filter: "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6))",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="100%"
                height="100%"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="8" x2="16" y2="16" />
                <line x1="16" y1="8" x2="8" y2="16" />
              </svg>
            </button>

            <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- див. коментар вище */}
              <img
                src={photoSrc}
                alt={item.name}
                onError={() => setPhotoFailed(true)}
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
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
                <ShareButton item={item} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
