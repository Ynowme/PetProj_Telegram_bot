"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { BlurText } from "@/components/BlurText";

export type PromoBanner = { id: string; title: string; description: string | null; imageUrl: string | null };

// Кругла стрілка перегортання — 44px, щоб влучати пальцем (мінімальна тач-ціль).
const ARROW_CLASS =
  "inline-flex size-11 items-center justify-center rounded-full border border-border bg-background/50 text-2xl leading-none text-foreground backdrop-blur-sm transition hover:bg-surface-hover active:scale-[0.97]";

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
      className="relative isolate cursor-pointer overflow-hidden border-b border-border bg-surface"
    >
      {banner.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- фото банера з CastaPOS-адмінки, довільний URL */}
          <img src={banner.imageUrl} alt="" aria-hidden className="pointer-events-none absolute inset-0 z-0 size-full object-cover" />
          {/* Той самий градієнт-оверлей, що на hero головної (app/(public)/page.tsx) — фото банера
              може бути світлим, текст лишається читабельним незалежно від контрасту фото. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-linear-to-r from-background/85 via-background/55 to-background/85" />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- декоративна текстура диму, не контентне зображення
        <img
          src="/smoke-bg.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[230%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 opacity-80"
        />
      )}

      <div className="relative z-[1] mx-auto grid min-h-[92px] w-full max-w-[1200px] grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 px-3 py-3 md:px-6">
        {canNavigate && (
          <button type="button" onClick={goPrev} aria-label="Попередня акція" className={`${ARROW_CLASS} col-start-1`}>
            ‹
          </button>
        )}
        <div className="col-start-2 grid gap-1 text-center">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted">Акція</span>
          <BlurText text={banner.title} animateBy="words" direction="top" delay={90} stepDuration={0.28} className="m-0 text-base font-bold md:text-lg" />
          {banner.description ? (
            <BlurText text={banner.description} animateBy="words" direction="top" delay={45} stepDuration={0.24} className="m-0 text-sm text-muted" />
          ) : null}
        </div>
        {canNavigate && (
          <button type="button" onClick={goNext} aria-label="Наступна акція" className={`${ARROW_CLASS} col-start-3`}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}
