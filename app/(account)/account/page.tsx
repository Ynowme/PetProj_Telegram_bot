import Link from "next/link";
import { Chip } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NAV_ITEMS: { href: string; title: string; description: string; goldOnly?: boolean }[] = [
  { href: "/account/table", title: "Мій стіл", description: "Привʼязка до столу та рахунок" },
  { href: "/account/bonuses", title: "Бонуси", description: "Баланс та історія нарахувань" },
  { href: "/account/receipts", title: "Історія чеків", description: "Чеки за останні 3 місяці" },
  { href: "/account/services", title: "Послуги", description: "Бронювання та оренда кальяну", goldOnly: true },
  { href: "/account/profile", title: "Профіль", description: "Імʼя, email і телефон" },
  { href: "/menu/favorites", title: "Обрані", description: "Збережені позиції меню" },
  { href: "/feedback", title: "Залишити відгук", description: "Поділіться враженнями" },
];

// FR-016: приветствие при первом входе (пока нет ни одного чека).
export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const [receiptsCount, user] = await Promise.all([
    prisma.receipt.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  const isFirstVisit = receiptsCount === 0;
  const isGold = user?.role === "GOLD_MEMBER";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-foreground">Особистий кабінет</h1>
        {/* Статус гостя завжди на видноті: Gold — теплий warning-soft, звичайний — стриманий default */}
        {isGold ? (
          <Chip color="warning" variant="soft">
            Gold Member
          </Chip>
        ) : (
          <Chip color="default" variant="soft">
            Member
          </Chip>
        )}
      </div>

      {isFirstVisit && (
        <p className="mt-3 text-muted">
          Ласкаво просимо, {session.user.name ?? "гостю"}! Раді бачити вас серед наших гостей 🎉
        </p>
      )}

      <nav aria-label="Розділи кабінету" className="mt-8 grid gap-3 sm:grid-cols-2">
        {NAV_ITEMS.filter((item) => !item.goldOnly || isGold).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-secondary active:scale-[0.98]"
          >
            <span className="grid gap-0.5">
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="text-sm text-muted">{item.description}</span>
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </nav>
    </main>
  );
}
