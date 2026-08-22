import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UsersTable, type UserRow } from "@/components/admin/UsersTable";

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

  // Дата — ISO-рядком: Date не серіалізується у пропси клієнтського компонента без втрат
  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    telegramUsername: user.telegramUsername,
    phone: user.phone,
    role: user.role,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    receiptsCount: user._count.receipts,
    bonusBalance: bonusBalanceByUserId.get(user.id) ?? 0,
  }));

  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Гості"
        subtitle={`Усі гості, що входили через Telegram: ${rows.length}`}
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Гості" }]}
      />
      <UsersTable rows={rows} />
    </section>
  );
}
