"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import SpecularButton from "@/components/SpecularButton";
import { FacebookIcon, GoogleIcon, InstagramIcon, TelegramIcon } from "@/components/SocialIcons";
import { computeActiveNavIndex, type NavItem } from "@/lib/nav";

type ContactInfo = {
  address: string;
  addressMapUrl: string | null;
  phone: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  googleUrl: string | null;
  telegramUrl: string | null;
};

export function SiteHeaderNav({ items, contact }: { items: NavItem[]; contact: ContactInfo | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = computeActiveNavIndex(items, pathname);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Профіль веде напряму в кабінет/вхід (reference: іконка профілю відкриває /auth), без
  // додаткового пропу — сесія вже закодована в тому, який пункт присутній серед items
  // (SiteHeader.tsx додає "Кабінет" лише залогіненим, "Увійти" — лише гостям).
  const isAuthed = items.some((item) => item.href === "/account");
  const accountHref = isAuthed ? "/account" : "/login";
  // Решта пунктів у шухляді — без того, що вже показане окремою CTA-карткою зверху
  // (reference: "Авторизуйтесь" — саме так, теж окремим боксом).
  const drawerItems = items.filter((item) => item.href !== "/account" && item.href !== "/login");

  const handleNavigate = (item: NavItem) => {
    setIsMenuOpen(false);
    if (item.kind === "signout") {
      void signOut({ callbackUrl: "/" });
      return;
    }
    router.push(item.href);
  };

  const goToAccount = () => {
    setIsMenuOpen(false);
    router.push(accountHref);
  };

  const socialLinks = contact
    ? [
        { href: contact.instagramUrl, label: "Instagram", Icon: InstagramIcon },
        { href: contact.facebookUrl, label: "Facebook", Icon: FacebookIcon },
        { href: contact.googleUrl, label: "Google", Icon: GoogleIcon },
        { href: contact.telegramUrl, label: "Telegram", Icon: TelegramIcon },
      ].filter((social): social is { href: string; label: string; Icon: typeof InstagramIcon } => Boolean(social.href))
    : [];

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

      {/* Мобільний варіант шапки (тільки іконки — reference: профіль + гамбургер замість рядка з
          вкладками) — окремий DOM, а не просто приховані SpecularButton: кожен з них тримає
          власний WebGL-контекст, рендерити всі items на мобільному тільки для того, щоб сховати
          їх через CSS — зайве навантаження на слабший процесор телефону. */}
      <div className="site-header__mobile-actions">
        <button type="button" className="site-header__icon-btn" aria-label="Профіль" onClick={goToAccount}>
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
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="site-header__drawer">
          <button type="button" className="site-header__drawer-cta" onClick={goToAccount}>
            <span className="site-header__drawer-cta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
              </svg>
            </span>
            {isAuthed ? "Особистий кабінет" : "Авторизуйтесь"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          {drawerItems.map((item) => (
            <button key={`drawer-${item.href}-${item.label}`} type="button" className="site-header__drawer-item" onClick={() => handleNavigate(item)}>
              {item.label}
            </button>
          ))}

          {contact && (
            <>
              <p className="site-header__drawer-section-title">Контакти</p>
              {contact.addressMapUrl ? (
                <a href={contact.addressMapUrl} target="_blank" rel="noreferrer" className="site-header__drawer-item">
                  📍 {contact.address}
                </a>
              ) : (
                <p className="site-header__drawer-item" style={{ margin: 0 }}>
                  📍 {contact.address}
                </p>
              )}
              <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="site-header__drawer-item">
                📞 {contact.phone}
              </a>

              {socialLinks.length > 0 && (
                <>
                  <p className="site-header__drawer-section-title">Ми в соцмережах</p>
                  <div className="site-header__drawer-socials">
                    {socialLinks.map(({ href, label, Icon }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="social-icon">
                        <Icon />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
