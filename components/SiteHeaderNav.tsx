"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import SpecularButton from "@/components/SpecularButton";
import { computeActiveNavIndex, type NavItem } from "@/lib/nav";

export function SiteHeaderNav({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = computeActiveNavIndex(items, pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Профіль веде напряму в кабінет/вхід (reference: іконка профілю відкриває /auth), без
  // додаткового пропу — сесія вже закодована в тому, який пункт присутній серед items
  // (SiteHeader.tsx додає "Кабінет" лише залогіненим, "Увійти" — лише гостям).
  const accountHref = items.find((item) => item.href === "/account")?.href ?? items.find((item) => item.label === "Увійти")?.href ?? "/login";

  const handleNavigate = (item: NavItem) => {
    setIsMenuOpen(false);
    if (item.kind === "signout") {
      void signOut({ callbackUrl: "/" });
      return;
    }
    router.push(item.href);
  };

  return (
    <>
      <nav className="site-header__nav">
        {items.map((item, index) => (
          <SpecularButton
            key={`${item.href}-${item.label}`}
            size="sm"
            radius={999}
            tintOpacity={index === activeIndex ? 0.08 : 0}
            textColor={index === activeIndex ? "#ffffff" : "#d9dde5"}
            lineColor="#ffffff"
            baseColor="#4a5260"
            proximity={180}
            onClick={() => handleNavigate(item)}
          >
            {item.label}
          </SpecularButton>
        ))}
      </nav>

      {/* Мобільний варіант шапки (тільки іконки — reference: профіль + гамбургер), окремий
          DOM, а не просто приховані SpecularButton: кожен з них тримає власний WebGL-контекст,
          рендерити всі items на мобільному тільки для того, щоб сховати їх через CSS — зайве
          навантаження на слабший процесор телефону. */}
      <div className="site-header__mobile-actions">
        <button
          type="button"
          className="site-header__icon-btn"
          aria-label="Профіль"
          onClick={() => router.push(accountHref)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
          </svg>
        </button>
        <button
          type="button"
          className="site-header__icon-btn"
          aria-label="Меню"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="site-header__drawer">
          {items.map((item) => (
            <button
              key={`drawer-${item.href}-${item.label}`}
              type="button"
              className="site-header__drawer-item"
              onClick={() => handleNavigate(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
