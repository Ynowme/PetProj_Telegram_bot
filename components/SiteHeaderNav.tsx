"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import SpecularButton from "@/components/SpecularButton";
import { computeActiveNavIndex, type NavItem } from "@/lib/nav";

export function SiteHeaderNav({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = computeActiveNavIndex(items, pathname);

  const handleNavigate = (item: NavItem) => {
    if (item.kind === "signout") {
      void signOut({ callbackUrl: "/" });
      return;
    }
    router.push(item.href);
  };

  return (
    <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
  );
}
