import Link from "next/link";
import { auth } from "@/lib/auth";
import { PromoCarousel } from "@/components/PromoCarousel";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import type { GooeyNavItem } from "@/components/GooeyNav";
import { getActivePromoBanners } from "@/lib/promo-banners";

export async function SiteHeader() {
  const [session, banners] = await Promise.all([auth(), getActivePromoBanners()]);

  const navItems: GooeyNavItem[] = [
    { label: "Меню", href: "/menu" },
    { label: "Популярне", href: "/menu/popular" },
    ...(session?.user
      ? [
          { label: "Кабінет", href: "/account" },
          ...(session.user.isAdmin ? [{ label: "Адмін", href: "/admin" }] : []),
          { label: "Вийти", href: "#", kind: "signout" as const },
        ]
      : [{ label: "Увійти", href: "/login" }]),
  ];

  return (
    <header style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
        }}
      >
        <Link href="/" style={{ display: "inline-flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- статичний line-art бейдж */}
          <img src="/logo.svg" alt="CASTANEDA smoking bar" width={48} height={48} />
        </Link>
        <SiteHeaderNav items={navItems} />
      </div>
      <PromoCarousel banners={banners} />
    </header>
  );
}
