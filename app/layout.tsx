import type { Metadata } from "next";
import { Yeseva_One } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Rakkas (з підбірки awwwards) не підтримує кирилицю — усі назви позицій українською,
// тож замість нього декоративний шрифт з тим самим "жирним вивісочним" характером,
// але з кирилицею: використовується для назви позиції поверх заглушки без фото (MenuItemCard).
const yesevaOne = Yeseva_One({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--font-yeseva",
});

export const metadata: Metadata = {
  title: "Бар — меню, акції та бонуси",
  description: "Сайт бару: меню, особистий кабінет гостя, контакти та години роботи.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={yesevaOne.variable}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
