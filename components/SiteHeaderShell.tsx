"use client";

import { useEffect, useRef } from "react";

const SCROLL_THRESHOLD = 60;

// Мобільна (див. .site-header__sticky--compact в globals.css, дію обмежено медіа-запитом
// там) компактна шапка: ховає рядок навігації при скролі вниз, показує назад при скролі
// вгору чи біля самого верху — звільняє вертикальний простір під липкі вкладки меню.
// Клас перемикається лише на межі стану (не щокадрово), і резервно кидає "resize" саме
// в цей момент — MenuBrowser вже слухає це, щоб перерахувати висоту липких панелей,
// тож координація без додаткових змін там.
export function SiteHeaderShell({ children }: { children: React.ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);
  const lastY = useRef(0);
  const isCompact = useRef(false);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    function apply(compact: boolean) {
      if (isCompact.current === compact) return;
      isCompact.current = compact;
      headerRef.current?.classList.toggle("site-header__sticky--compact", compact);
      window.dispatchEvent(new Event("resize"));
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY.current;
        if (y <= SCROLL_THRESHOLD) {
          apply(false);
        } else {
          apply(goingDown);
        }
        lastY.current = y;
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
