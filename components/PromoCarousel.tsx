"use client";

import { useRef, useState } from "react";
import { BlurText } from "@/components/BlurText";

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
      className="promo-carousel"
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
        className="promo-carousel__content"
      >
        {canNavigate && (
          <button type="button" onClick={goPrev} aria-label="Попередня акція">
            ‹
          </button>
        )}
        <div className="promo-carousel__copy">
          <span className="promo-carousel__eyebrow">Special offer</span>
          <BlurText
            text={banner.title}
            animateBy="words"
            direction="top"
            delay={90}
            stepDuration={0.28}
            className="promo-carousel__title"
          />
          {banner.description ? (
            <BlurText
              text={banner.description}
              animateBy="words"
              direction="top"
              delay={45}
              stepDuration={0.24}
              className="promo-carousel__description"
            />
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
