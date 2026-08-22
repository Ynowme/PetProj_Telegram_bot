import { notFound } from "next/navigation";
import { Card, Chip, Table } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBonusBalance } from "@/lib/bonuses";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { UserRoleChip } from "@/components/admin/UserRoleChip";

// REFUNDED/CANCELLED — "небойові" статуси чека, підсвічуються danger-кольором;
// підтверджений чек — звичайний стан, окремого чипа не потребує.
function receiptStatusChip(status: string) {
  const label = RECEIPT_STATUS_LABEL[status];
  if (!label) return null;
  return (
    <Chip color="danger" variant="soft" size="sm">
      {label}
    </Chip>
  );
}

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

  const dateFormat = new Intl.DateTimeFormat("uk-UA");
  const moneyCell = "text-right tabular-nums";

  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title={user.name}
        subtitle={user.telegramUsername ? `@${user.telegramUsername}` : "без Telegram username"}
        breadcrumbs={[
          { label: "Адміністрування", href: "/admin" },
          { label: "Гості", href: "/admin/users" },
          { label: user.name },
        ]}
      />

      <Card>
        <Card.Content className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <UserRoleChip role={user.role} />
            {user.isAdmin && (
              <Chip color="accent" variant="soft" size="sm">
                адмін
              </Chip>
            )}
            {user.phone &&
              (user.phoneVerifiedAt ? (
                <Chip color="success" variant="soft" size="sm">
                  телефон підтверджено
                </Chip>
              ) : (
                <Chip color="warning" variant="soft" size="sm">
                  телефон не підтверджено
                </Chip>
              ))}
          </div>
          <dl className="grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">Телефон:</dt>
              <dd className="text-foreground">{user.phone ?? "немає"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Telegram ID:</dt>
              <dd className="text-foreground tabular-nums">{user.telegramId ?? "немає"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Зареєстрований:</dt>
              <dd className="text-foreground">{dateFormat.format(user.createdAt)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted">
            Бонусний баланс:{" "}
            <strong className="text-base text-accent tabular-nums">{bonusBalance} ₴</strong>
          </p>
        </Card.Content>
      </Card>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-foreground">Чеки ({receipts.length})</h2>
        {receipts.length === 0 ? (
          <AdminEmptyState title="Чеків немає" description="Чеки зʼявляться після першого внесення." />
        ) : (
          <Table>
            <Table.ScrollContainer className="max-h-[50vh] [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-surface">
              <Table.Content aria-label="Чеки гостя">
                <Table.Header>
                  <Table.Column isRowHeader>Дата</Table.Column>
                  <Table.Column>Статус</Table.Column>
                  <Table.Column className="text-right">Сума</Table.Column>
                </Table.Header>
                <Table.Body>
                  {receipts.map((receipt) => (
                    <Table.Row key={receipt.id} id={receipt.id}>
                      <Table.Cell>{dateFormat.format(receipt.date)}</Table.Cell>
                      <Table.Cell>{receiptStatusChip(receipt.status) ?? <span className="text-muted">—</span>}</Table.Cell>
                      <Table.Cell className={moneyCell}>
                        {Number(receipt.totalAmount)} {receipt.currency}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-foreground">Історія бонусів ({bonusTransactions.length})</h2>
        {bonusTransactions.length === 0 ? (
          <AdminEmptyState title="Операцій немає" description="Нарахування і списання бонусів зʼявляться тут." />
        ) : (
          <Table>
            <Table.ScrollContainer className="max-h-[50vh] [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-surface">
              <Table.Content aria-label="Історія бонусів">
                <Table.Header>
                  <Table.Column isRowHeader>Дата</Table.Column>
                  <Table.Column>Підстава</Table.Column>
                  <Table.Column className="text-right">Сума</Table.Column>
                </Table.Header>
                <Table.Body>
                  {bonusTransactions.map((tx) => (
                    <Table.Row key={tx.id} id={tx.id}>
                      <Table.Cell>{dateFormat.format(tx.createdAt)}</Table.Cell>
                      <Table.Cell>{tx.reason}</Table.Cell>
                      <Table.Cell className={`${moneyCell} ${Number(tx.amount) < 0 ? "text-danger" : "text-success"}`}>
                        {Number(tx.amount)} ₴
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>
    </section>
  );
}
