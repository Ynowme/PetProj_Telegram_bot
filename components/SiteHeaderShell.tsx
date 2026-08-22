// Хедер завжди лишається приклеєним зверху під час скролу (reference: easy.choiceqr.com
// не ховає свою шапку) — раніше тут була логіка "ховати рядок навігації при скролі вниз",
// прибрана за проханням користувача: категорійні вкладки меню (MenuBrowser.tsx) міряють
// висоту хедера через [data-site-header], тож стабільна незмінна висота простіше й
// надійніше, ніж синхронізація з динамічним показом/хованням.
export function SiteHeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <header data-site-header className="sticky top-0 z-[60] border-b border-border bg-background">
      {children}
    </header>
  );
}
