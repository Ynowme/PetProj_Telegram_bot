import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  MEMBER: "Member",
  GOLD_MEMBER: "Gold Member",
};

// Список всех гостей, когда-либо авторизованных через Telegram: чеки и бонусный баланс — одним запросом на всех, без N+1.
export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) return null; // защищено proxy.ts

  const [users, bonusSums] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        telegramUsername: true,
        phone: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { receipts: true } },
      },
    }),
    prisma.bonusTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const bonusBalanceByUserId = new Map(bonusSums.map((row) => [row.userId, Number(row._sum.amount ?? 0)]));

  return (
    <main className="page">
      <Link href="/admin" className="back-link">
        ← Адміністрування
      </Link>
      <h1>Гості</h1>

      {users.length === 0 ? (
        <p className="text-muted">Ще ніхто не входив через Telegram.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.6rem", marginTop: "1rem" }}>
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="panel"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
            >
              <div>
                <strong>{user.name}</strong>
                {user.isAdmin && <span className="text-muted"> · адмін</span>}
                <p className="text-muted" style={{ margin: 0 }}>
                  {user.telegramUsername ? `@${user.telegramUsername}` : "без Telegram username"}
                  {user.phone ? ` · ${user.phone}` : ""} · {ROLE_LABEL[user.role] ?? user.role}
                </p>
                <p className="text-muted" style={{ margin: 0 }}>
                  Зареєстрований {new Intl.DateTimeFormat("uk-UA").format(user.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>{user._count.receipts} чек(ів)</div>
                <strong style={{ color: "var(--accent-bright)" }}>
                  {bonusBalanceByUserId.get(user.id) ?? 0} ₴ бонусів
                </strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
