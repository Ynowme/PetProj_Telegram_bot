"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@heroui/react";

// base — префікс для підсвітки активного розділу: href може вести на вкладений роут
// (наприклад /admin/receipts/new), а активність визначається по сегменту розділу.
const SECTIONS = [
  { id: "overview", base: "/admin", href: "/admin", label: "Огляд" },
  { id: "users", base: "/admin/users", href: "/admin/users", label: "Гості" },
  { id: "receipts", base: "/admin/receipts", href: "/admin/receipts/new", label: "Внести чек" },
  { id: "tables", base: "/admin/table-sessions", href: "/admin/table-sessions", label: "Столи" },
  { id: "services", base: "/admin/service-requests", href: "/admin/service-requests", label: "Послуги" },
  { id: "reviews", base: "/admin/reviews", href: "/admin/reviews", label: "Відгуки" },
  { id: "bonuses", base: "/admin/bonus-settings", href: "/admin/bonus-settings", label: "Бонуси" },
] as const;

// Навігація між розділами адмінки: вкладки працюють як посилання (href + RouterProvider),
// а не як локальний стан з панелями, бо кожен розділ — окремий роут Next.js.
export function AdminNavTabs() {
  const pathname = usePathname();
  const active =
    pathname === "/admin"
      ? "overview"
      : (SECTIONS.find((section) => section.id !== "overview" && pathname.startsWith(section.base))?.id ?? "overview");

  return (
    <Tabs selectedKey={active} aria-label="Розділи адміністрування">
      {/* overflow-x-auto — на вузьких екранах сім вкладок не влазять, тож список скролиться */}
      <Tabs.ListContainer className="overflow-x-auto">
        <Tabs.List>
          {/* Індикатор живе всередині кожного Tab: окремий <Tabs.Indicator /> поза табом
              падає в рантаймі ("SharedElement must be rendered inside SharedElementTransition").
              whitespace-nowrap — двослівні назви розділів не ламаються на два рядки. */}
          {SECTIONS.map((section) => (
            <Tabs.Tab key={section.id} id={section.id} href={section.href} className="whitespace-nowrap">
              {section.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
