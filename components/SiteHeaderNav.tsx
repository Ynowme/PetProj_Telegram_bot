"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@heroui/react";
import { FacebookIcon, GoogleIcon, InstagramIcon, SocialIconLink, TelegramIcon } from "@/components/SocialIcons";
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

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

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
      {/* Десктопна навігація: активний пункт — заповнена secondary-кнопка, решта ghost.
          Раніше тут були SpecularButton (WebGL на кожен пункт) — прибрані разом із міграцією
          на HeroUI: стокова темна тема не потребує окремого шейдерного світіння. */}
      <nav aria-label="Основна навігація" className="hidden items-center justify-end gap-1 md:flex">
        {items.map((item, index) => (
          <Button
            key={`${item.href}-${item.label}`}
            size="sm"
            variant={index === activeIndex ? "secondary" : "ghost"}
            className={index === activeIndex ? undefined : "text-muted hover:text-foreground"}
            onPress={() => handleNavigate(item)}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Мобільний варіант шапки (тільки іконки — reference: профіль + гамбургер замість
          рядка з вкладками). Іконки 44px — мінімальна тач-ціль. */}
      <div className="flex items-center gap-1.5 md:hidden">
        <Button isIconOnly variant="outline" aria-label="Профіль" className="size-11" onPress={goToAccount}>
          <ProfileIcon />
        </Button>
        <Button
          isIconOnly
          variant="outline"
          aria-label="Меню"
          aria-expanded={isMenuOpen}
          className="size-11"
          onPress={() => setIsMenuOpen((open) => !open)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </Button>
      </div>

      {/* Випадаюча панель пунктів меню (гамбургер, мобільний хедер) — reference відкриває для
          цього окрему сторінку/шухляду, тут простіше: абсолютно позиційована панель під шапкою. */}
      {isMenuOpen && (
        <div className="absolute inset-x-0 top-full z-[59] grid max-h-[85dvh] gap-1 overflow-y-auto border-b border-border bg-surface px-4 pb-5 pt-3 shadow-lg md:hidden">
          <button
            type="button"
            onClick={goToAccount}
            className="mb-2 flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-surface-secondary p-3.5 text-left text-sm font-semibold text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface">
              <ProfileIcon />
            </span>
            {isAuthed ? "Особистий кабінет" : "Авторизуйтесь"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          {drawerItems.map((item) => (
            <button
              key={`drawer-${item.href}-${item.label}`}
              type="button"
              onClick={() => handleNavigate(item)}
              className="block min-h-11 w-full rounded-lg px-3 py-3 text-left text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
            >
              {item.label}
            </button>
          ))}

          {contact && (
            <>
              <p className="mx-3 mb-0 mt-3 border-t border-separator pt-3 text-xs uppercase tracking-wider text-muted">Контакти</p>
              {contact.addressMapUrl ? (
                <a
                  href={contact.addressMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block min-h-11 w-full rounded-lg px-3 py-3 text-left text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
                >
                  📍 {contact.address}
                </a>
              ) : (
                <p className="m-0 block w-full px-3 py-3 text-left text-sm text-foreground">📍 {contact.address}</p>
              )}
              <a
                href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                className="block min-h-11 w-full rounded-lg px-3 py-3 text-left text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
              >
                📞 {contact.phone}
              </a>

              {socialLinks.length > 0 && (
                <>
                  <p className="mx-3 mb-0 mt-3 border-t border-separator pt-3 text-xs uppercase tracking-wider text-muted">Ми в соцмережах</p>
                  <div className="flex gap-2.5 px-3 pt-2">
                    {socialLinks.map(({ href, label, Icon }) => (
                      <SocialIconLink key={label} href={href} label={label}>
                        <Icon />
                      </SocialIconLink>
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
