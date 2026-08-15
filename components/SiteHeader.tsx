import Link from "next/link";
import { auth } from "@/lib/auth";
import { PromoCarousel } from "@/components/PromoCarousel";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import type { NavItem } from "@/lib/nav";
import { getActivePromoBanners } from "@/lib/promo-banners";
import { getSiteContent } from "@/lib/site-content";

export async function SiteHeader() {
  const [session, banners, siteContent] = await Promise.all([auth(), getActivePromoBanners(), getSiteContent()]);

  const navItems: NavItem[] = [
    { label: "Меню", href: "/menu" },
    { label: "Популярне", href: "/menu/popular" },
    { label: "Залишити відгук", href: "/feedback" },
    ...(session?.user
      ? [
          { label: "Кабінет", href: "/account" },
          ...(session.user.isAdmin ? [{ label: "Адмін", href: "/admin" }] : []),
          { label: "Вийти", href: "#", kind: "signout" as const },
        ]
      : [{ label: "Увійти", href: "/login" }]),
  ];

  return (
    // Липка тільки шапка (лого + навігація), не банер-карусель нижче — інакше вона б
    // назавжди займала екран при скролі. Карусель навмисно ВИНЕСЕНА з <header> як сусідній
    // елемент: position:sticky обмежена висотою свого батька, а батько тут — <header> — був
    // би заввишки "шапка + карусель" і липкість зникала б одразу за каруселлю.
    <>
      <header className="site-header__sticky">
        <div className="site-header__bar">
          <Link href="/" style={{ display: "inline-flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- лого з CastaPOS-адмінки або статичний фолбек-бейдж */}
            <img src={siteContent?.logoUrl ?? "/logo.svg"} alt={siteContent?.venueName ?? "Логотип закладу"} width={48} height={48} />
          </Link>
          <SiteHeaderNav items={navItems} />
        </div>
      </header>
      <PromoCarousel banners={banners} />
    </>
  );
}
