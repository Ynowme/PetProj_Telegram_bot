import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";
import { BackLink } from "@/components/account/BackLink";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";

// FR-007, FR-016: история чеков; пусто при первом входе — без ошибки.
export default async function ReceiptsPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <BackLink href="/account">Кабінет</BackLink>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">Історія чеків</h1>
      <p className="mt-1 text-sm text-muted">Зберігається 3 місяці</p>

      {receipts.length === 0 ? (
        <Card className="mt-6">
          <AccountEmptyState
            title="У вас поки немає чеків"
            description="Після першого підтвердженого чека він зʼявиться тут"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2Z" />
                <path d="M9 7h6M9 11h6" />
              </svg>
            }
          />
        </Card>
      ) : (
        <ul className="mt-6 grid gap-3">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <Link
                href={`/account/receipts/${receipt.id}`}
                className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-secondary active:scale-[0.98]"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm tabular-nums text-foreground">
                    {new Intl.DateTimeFormat("uk-UA").format(receipt.date)}
                  </span>
                  {RECEIPT_STATUS_LABEL[receipt.status] && (
                    <Chip color="danger" variant="soft" size="sm">
                      {RECEIPT_STATUS_LABEL[receipt.status]}
                    </Chip>
                  )}
                </span>
                <span className="shrink-0 text-right font-medium tabular-nums text-accent">
                  {Number(receipt.totalAmount)} {receipt.currency}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
