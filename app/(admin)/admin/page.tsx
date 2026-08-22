import Link from "next/link";
import { Card } from "@heroui/react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const SECTIONS = [
  { href: "/admin/users", title: "Гості", description: "Всі гості, їхні чеки та бонусні баланси" },
  { href: "/admin/bonus-settings", title: "Ставка бонусів", description: "Відсоток нарахування бонусів від суми чека" },
  { href: "/admin/receipts/new", title: "Внести чек", description: "Ручне внесення чека гостя за телефоном" },
  {
    href: "/admin/table-sessions",
    title: "Привʼязка до столу",
    description: "Запити гостей на привʼязку до столу за QR-кодом",
  },
  { href: "/admin/service-requests", title: "Запити на послуги", description: "Бронювання столів та оренда кальяну" },
  { href: "/admin/reviews", title: "Відгуки гостей", description: "Оцінки страв і сервісу, коментарі та контакти" },
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader title="Адміністрування" subtitle="Керування гостями, бонусами та запитами закладу" />
      <nav aria-label="Розділи адміністрування" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="group">
            {/* h-full — картки в ряду однакової висоти незалежно від довжини опису */}
            <Card className="h-full transition-colors group-hover:border-accent">
              <Card.Header>
                <Card.Title className="flex items-center justify-between gap-2">
                  {section.title}
                  <span aria-hidden className="text-muted transition-colors group-hover:text-accent">
                    →
                  </span>
                </Card.Title>
                <Card.Description>{section.description}</Card.Description>
              </Card.Header>
            </Card>
          </Link>
        ))}
      </nav>
    </section>
  );
}
