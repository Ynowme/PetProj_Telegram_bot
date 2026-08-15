"use client";

import { useEffect, useRef } from "react";

const SCROLL_THRESHOLD = 60;
// Скільки треба проскролити безперервно в один бік, перш ніж перемкнути стан.
// Без цього допуску кожне мікротремтіння скролу (inertia-скрол на телефоні, iOS
// rubber-band на самому верху) миттєво перемикає напрям туди-сюди — хедер
// "блимає" замість одного плавного ховання/показу (звіт користувача 2026-08-16).
const DIRECTION_DELTA = 12;

// Мобільна (див. .site-header__sticky--compact в globals.css, дію обмежено медіа-запитом
// там) компактна шапка: ховає рядок навігації при скролі вниз, показує назад при скролі
// вгору чи біля самого верху — звільняє вертикальний простір під липкі вкладки меню.
// Клас перемикається лише на межі стану (не щокадрово), і резервно кидає "resize" саме
// в цей момент — MenuBrowser вже слухає це, щоб перерахувати висоту липких панелей,
// тож координація без додаткових змін там.
export function SiteHeaderShell({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const lastY = useRef(0);
  // Накопичене зміщення в поточному напрямку відсинку останнього перемикання —
  // не "остання дельта", а сума, щоб короткі тремтіння самі гасились протилежним
  // знаком, а не накопичувались у випадковий бік.
  const accumulated = useRef(0);
  const isCompact = useRef(false);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = Math.max(0, window.scrollY);

    function apply(compact: boolean) {
      accumulated.current = 0;
      if (isCompact.current === compact) return;
      isCompact.current = compact;
      headerRef.current?.classList.toggle("site-header__sticky--compact", compact);
      window.dispatchEvent(new Event("resize"));
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        // iOS rubber-band при відскоку зверху/знизу дає scrollY < 0 чи > maxScroll,
        // ігноруємо ці фантомні краї — clamp до 0 знизу.
        const y = Math.max(0, window.scrollY);
        const delta = y - lastY.current;
        lastY.current = y;

        if (y <= SCROLL_THRESHOLD) {
          apply(false);
          ticking.current = false;
          return;
        }

        const sameDirection = (accumulated.current >= 0 && delta >= 0) || (accumulated.current <= 0 && delta < 0);
        accumulated.current = sameDirection ? accumulated.current + delta : delta;

        if (accumulated.current >= DIRECTION_DELTA) {
          apply(true);
        } else if (accumulated.current <= -DIRECTION_DELTA) {
          apply(false);
        }

        ticking.current = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={headerRef} className="site-header__sticky">
      {children}
    </header>
  );
}
