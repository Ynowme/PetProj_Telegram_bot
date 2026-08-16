// Хедер завжди лишається приклеєним зверху під час скролу (reference: easy.choiceqr.com
// не ховає свою шапку) — раніше тут була логіка "ховати рядок навігації при скролі вниз",
// прибрана за проханням користувача: категорійні вкладки меню (MenuBrowser.tsx) міряють
// висоту .site-header__sticky, тож стабільна незмінна висота простіше й надійніше, ніж
// синхронізація з динамічним показом/ховання.
export function SiteHeaderShell({ children }: { children: React.ReactNode }) {
  return <header className="site-header__sticky">{children}</header>;
}
