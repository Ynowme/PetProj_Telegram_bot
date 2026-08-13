import type { Metadata } from "next";
import { Yeseva_One } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteContent } from "@/lib/site-content";
import { deriveAccentTheme } from "@/lib/color";

// Rakkas (з підбірки awwwards) не підтримує кирилицю — усі назви позицій українською,
// тож замість нього декоративний шрифт з тим самим "жирним вивісочним" характером,
// але з кирилицею: використовується для назви позиції поверх заглушки без фото (MenuItemCard).
const yesevaOne = Yeseva_One({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--font-yeseva",
});

// venueName/aboutText/faviconUrl приходять з CastaPOS-адмінки (app/api/webhooks/pos/site-content)
// — фолбек на статичні рядки, поки власник ще нічого не зберіг. getSiteContent кешується через
// React cache(), тож повторний виклик тут і в SiteHeader/SiteFooter/page.tsx — один запит до БД.
export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getSiteContent();
  return {
    title: siteContent?.venueName ? `${siteContent.venueName} — меню, акції та бонуси` : "Бар — меню, акції та бонуси",
    description: siteContent?.aboutText ?? "Сайт бару: меню, особистий кабінет гостя, контакти та години роботи.",
    icons: siteContent?.faviconUrl ? { icon: siteContent.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();
  const theme = siteContent?.accentColor ? deriveAccentTheme(siteContent.accentColor) : null;

  return (
    <html
      lang="uk"
      className={yesevaOne.variable}
      style={
        theme
          ? ({
              "--accent": theme.accent,
              "--accent-bright": theme.accentBright,
              "--accent-muted": theme.accentMuted,
              "--accent-contrast": theme.accentContrast,
            } as React.CSSProperties)
          : undefined
      }
    >
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
