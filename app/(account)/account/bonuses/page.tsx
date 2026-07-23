import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBonusBalance, getBonusHistory } from "@/lib/bonuses";
import { getBonusPercentage } from "@/lib/bonus-settings";
import { GOLD_THRESHOLD } from "@/lib/roles";
import { TelegramBotLinkSection } from "@/components/TelegramBotLinkSection";

// FR-009, FR-010, FR-025: баланс в валюте + история операций; траты бонусов на сайте нет.
export default async function BonusesPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const [balance, history, user, percentage] = await Promise.all([
    getBonusBalance(session.user.id),
    getBonusHistory(session.user.id),
    prisma.user.findUnique({ where: { id: session.user.id } }),
    getBonusPercentage(),
  ]);

  const isGold = user?.role === "GOLD_MEMBER";

  return (
    <main className="page">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <h1>Бонуси</h1>
      <p style={{ fontSize: "2rem", fontFamily: "var(--font-display)", color: "var(--accent-bright)" }}>
        {balance} ₴
      </p>

      <p className="text-muted">
        {isGold
          ? `Ви Gold Member — на бонусний рахунок нараховується ${percentage}% від суми кожного підтвердженого чека. Списати бонуси онлайн не можна — тільки офлайн у закладі.`
          : `Gold Member нараховується автоматично, коли за календарний місяць набирається ${GOLD_THRESHOLD} підтверджених чеків. Після цього на рахунок нараховується ${percentage}% від суми кожного чека.`}
      </p>

      {history.length === 0 ? (
        <p className="text-muted">Операцій з бонусами поки не було.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {history.map((entry) => (
            <li
              key={entry.id}
              className="panel"
              style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem" }}
            >
              <span className="text-muted">
                {new Intl.DateTimeFormat("uk-UA").format(entry.createdAt)} — {entry.reason}
              </span>
              <span style={{ color: Number(entry.amount) > 0 ? "var(--success)" : "var(--danger)" }}>
                {Number(entry.amount) > 0 ? "+" : ""}
                {Number(entry.amount)} ₴
              </span>
            </li>
          ))}
        </ul>
      )}

      {isGold && <TelegramBotLinkSection />}
    </main>
  );
}
