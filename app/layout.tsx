import type { Metadata } from "next";
import { Golos_Text, Yeseva_One } from "next/font/google";
import "./globals.css";
import "./hero.css";
import { HeroUIProviders } from "@/components/providers/HeroUIProviders";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteContent } from "@/lib/site-content";
import { deriveAccentTheme } from "@/lib/color";

// Golos Text — той самий основний шрифт, що й у CastaPOS: повна кирилиця
// (укр. і/ї/є/ґ у cyrillic-ext), табличні цифри для сум бонусів і чеків.
const golos = Golos_Text({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

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

  // class="dark" — тема залочена на стокову темну HeroUI, як у CastaPOS.
  // Динамічний акцент із CastaPOS-адмінки (SiteContent.accentColor) зберігається:
  // inline-стилі перемагають будь-який CSS-шар, тож --accent/--accent-foreground
  // HeroUI перекриваються кольором власника; без accentColor — рідний синій.
  return (
    <html
      lang="uk"
      className={`dark ${golos.variable} ${yesevaOne.variable}`}
      style={
        theme
          ? ({
              "--accent": theme.accent,
              "--accent-foreground": theme.accentContrast,
              "--accent-bright": theme.accentBright,
              "--accent-muted": theme.accentMuted,
              "--accent-contrast": theme.accentContrast,
            } as React.CSSProperties)
          : undefined
      }
    >
      <body>
        <HeroUIProviders>
          <SiteHeader />
          {children}
          <SiteFooter />
        </HeroUIProviders>
      </body>
    </html>
  );
}
