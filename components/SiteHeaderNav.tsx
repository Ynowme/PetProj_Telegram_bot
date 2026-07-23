"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { GooeyNav, type GooeyNavItem } from "@/components/GooeyNav";
import { computeActiveNavIndex } from "@/lib/nav";

export function SiteHeaderNav({ items }: { items: GooeyNavItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = computeActiveNavIndex(items, pathname);

  const handleNavigate = (item: GooeyNavItem) => {
    if (item.kind === "signout") {
      void signOut({ callbackUrl: "/" });
      return;
    }
    router.push(item.href);
  };

  return <GooeyNav items={items} activeIndex={activeIndex} onNavigate={handleNavigate} />;
}
