"use client";

import { useRef, useState } from "react";

export type PromoBanner = { id: string; title: string; description: string | null };

// FR-008: свайпаемая карусель баннеров; при одном баннере переключение недоступно.
export function PromoCarousel({ banners }: { banners: PromoBanner[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (banners.length === 0) return null;

  const canNavigate = banners.length > 1;
  const banner = banners[index % banners.length];

  const goPrev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
  const goNext = () => setIndex((i) => (i + 1) % banners.length);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || !canNavigate) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- декоративна текстура диму, не контентне зображення */}
      <img
        src="/smoke-bg.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          height: "230%",
          width: "auto",
          maxWidth: "none",
          opacity: 0.8,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          minHeight: 84,
          padding: "0.75rem 1.5rem",
        }}
      >
        {canNavigate && (
          <button type="button" onClick={goPrev} aria-label="Попередня акція">
            ‹
          </button>
        )}
        <div style={{ flex: 1, textAlign: "center", textShadow: "0 1px 6px rgba(10, 9, 8, 0.9)" }}>
          <strong style={{ color: "var(--accent-bright)" }}>{banner.title}</strong>
          {banner.description ? (
            <span style={{ color: "var(--foreground)" }}> — {banner.description}</span>
          ) : null}
        </div>
        {canNavigate && (
          <button type="button" onClick={goNext} aria-label="Наступна акція">
            ›
          </button>
        )}
      </div>
    </div>
  );
}
