import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBonusBalance } from "@/lib/bonuses";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";

const ROLE_LABEL: Record<string, string> = {
  MEMBER: "Member",
  GOLD_MEMBER: "Gold Member",
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return null; // защищено proxy.ts

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      telegramUsername: true,
      telegramId: true,
      phone: true,
      phoneVerifiedAt: true,
      role: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const [receipts, bonusTransactions, bonusBalance] = await Promise.all([
    prisma.receipt.findMany({ where: { userId: id }, orderBy: { date: "desc" } }),
    prisma.bonusTransaction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
    getBonusBalance(id),
  ]);

  return (
    <main className="page">
      <Link href="/admin/users" className="back-link">
        ← Гості
      </Link>

      <div className="panel">
        <h1 style={{ marginTop: 0 }}>{user.name}</h1>
        <p className="text-muted" style={{ margin: 0 }}>
          {user.telegramUsername ? `@${user.telegramUsername}` : "без Telegram username"} · Telegram ID{" "}
          {user.telegramId ?? "—"}
        </p>
        <p className="text-muted" style={{ margin: 0 }}>
          Телефон: {user.phone ?? "—"} {user.phone && (user.phoneVerifiedAt ? "(підтверджено)" : "(не підтверджено)")}
        </p>
        <p className="text-muted" style={{ margin: 0 }}>
          {ROLE_LABEL[user.role] ?? user.role}
          {user.isAdmin && " · адмін"} · зареєстрований {new Intl.DateTimeFormat("uk-UA").format(user.createdAt)}
        </p>
        <p style={{ marginBottom: 0 }}>
          Бонусний баланс: <strong style={{ color: "var(--accent-bright)" }}>{bonusBalance} ₴</strong>
        </p>
      </div>

      <h2>Чеки ({receipts.length})</h2>
      {receipts.length === 0 ? (
        <p className="text-muted">Чеків немає.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {receipts.map((receipt) => (
            <li key={receipt.id} className="panel">
              {new Intl.DateTimeFormat("uk-UA").format(receipt.date)} —{" "}
              <strong style={{ color: "var(--accent-bright)" }}>
                {Number(receipt.totalAmount)} {receipt.currency}
              </strong>
              {RECEIPT_STATUS_LABEL[receipt.status] && (
                <span className="text-muted"> · {RECEIPT_STATUS_LABEL[receipt.status]}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2>Історія бонусів ({bonusTransactions.length})</h2>
      {bonusTransactions.length === 0 ? (
        <p className="text-muted">Операцій немає.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {bonusTransactions.map((tx) => (
            <li key={tx.id} className="panel">
              {new Intl.DateTimeFormat("uk-UA").format(tx.createdAt)} —{" "}
              <strong style={{ color: "var(--accent-bright)" }}>{Number(tx.amount)} ₴</strong>
              <span className="text-muted"> · {tx.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
