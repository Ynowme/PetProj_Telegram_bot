import { Card, CardContent, Chip } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBonusBalance, getBonusHistory } from "@/lib/bonuses";
import { getBonusPercentage } from "@/lib/bonus-settings";
import { GOLD_THRESHOLD } from "@/lib/roles";
import { TelegramBotLinkSection } from "@/components/TelegramBotLinkSection";
import { BackLink } from "@/components/account/BackLink";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";

// FR-009, FR-010, FR-025: баланс в валюте + история операций; траты бонусов на сайте нет.
export default async function BonusesPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const [balance, history, user, percentage] = await Promise.all([
    getBonusBalance(session.user.id),
    getBonusHistory(session.user.id),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
    getBonusPercentage(),
  ]);

  const isGold = user?.role === "GOLD_MEMBER";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <BackLink href="/account">Кабінет</BackLink>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">Бонуси</h1>

      {/* Hero-метрика балансу — той самий прийом, що на дашборді CastaPOS: одна велика
          цифра в акцентній картці, статус гостя поруч */}
      <Card className="mt-6 bg-accent-soft">
        <CardContent className="grid gap-1 p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Бонусний баланс</p>
            {isGold && (
              <Chip color="warning" variant="soft" size="sm">
                Gold Member
              </Chip>
            )}
          </div>
          <p className="text-4xl font-semibold tabular-nums text-foreground">{balance} ₴</p>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted">
        {isGold
          ? `Ви Gold Member: на бонусний рахунок нараховується ${percentage}% від суми кожного підтвердженого чека. Списати бонуси онлайн не можна, тільки офлайн у закладі.`
          : `Gold Member нараховується автоматично, коли за календарний місяць набирається ${GOLD_THRESHOLD} підтверджених чеків. Після цього на рахунок нараховується ${percentage}% від суми кожного чека.`}
      </p>

      <h2 className="mt-8 text-lg font-medium text-foreground">Історія операцій</h2>
      {history.length === 0 ? (
        <Card className="mt-3">
          <AccountEmptyState
            title="Операцій з бонусами поки не було"
            description="Нарахування зʼявляться тут після перших підтверджених чеків"
          />
        </Card>
      ) : (
        <Card className="mt-3">
          <CardContent className="p-0">
            <ul className="divide-y divide-separator">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0 text-sm text-muted">
                    <span className="tabular-nums">{new Intl.DateTimeFormat("uk-UA").format(entry.createdAt)}</span>
                    {" · "}
                    {entry.reason}
                  </span>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      Number(entry.amount) > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {Number(entry.amount) > 0 ? "+" : ""}
                    {Number(entry.amount)} ₴
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isGold && <TelegramBotLinkSection />}
    </main>
  );
}
