"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { BlurText } from "@/components/BlurText";

export type PromoBanner = { id: string; title: string; description: string | null; imageUrl: string | null };

// FR-008: свайпаемая карусель баннеров; при одном баннере переключение недоступно. Клік по
// банеру (крім стрілок ‹›) веде на /promotions — повний перелік акцій з фото та описом без
// обрізання. Той самий патерн "клікована картка з вкладеними кнопками, що зупиняють
// спливання", що MenuItemCard.tsx: тут теж role="button" на div, а не <Link>, бо вкладені
// <button> (стрілки) всередині <a> — невалідний HTML.
export function PromoCarousel({ banners }: { banners: PromoBanner[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (banners.length === 0) return null;

  const canNavigate = banners.length > 1;
  const banner = banners[index % banners.length];

  const goPrev = (event?: ReactMouseEvent) => {
    event?.stopPropagation();
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  };
  const goNext = (event?: ReactMouseEvent) => {
    event?.stopPropagation();
    setIndex((i) => (i + 1) % banners.length);
  };
  const openPromotions = () => router.push("/promotions");

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
      role="button"
      tabIndex={0}
      aria-label="Переглянути всі акції"
      onClick={openPromotions}
      onKeyDown={(event: ReactKeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPromotions();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
      }}
    >
      {banner.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- фото банера з CastaPOS-адмінки, довільний URL */}
          <img
            src={banner.imageUrl}
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          {/* Той самий градієнт-оверлей, що на hero головної (app/(public)/page.tsx) — фото банера
              може бути світлим, текст лишається читабельним незалежно від контрасту фото. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background: "linear-gradient(90deg, rgba(10, 10, 12, 0.85) 0%, rgba(10, 10, 12, 0.55) 55%, rgba(10, 10, 12, 0.85) 100%)",
            }}
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- декоративна текстура диму, не контентне зображення
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
      )}

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
