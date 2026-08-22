import { notFound } from "next/navigation";
import { Card, CardContent, Chip } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";
import { BackLink } from "@/components/account/BackLink";

// FR-007, FR-011: полный состав чека, доступен только владельцу.
export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({ where: { id }, include: { items: true } });

  if (!receipt || receipt.userId !== session.user.id) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <BackLink href="/account/receipts">Історія чеків</BackLink>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-foreground">
          Чек від <span className="tabular-nums">{new Intl.DateTimeFormat("uk-UA").format(receipt.date)}</span>
        </h1>
        {RECEIPT_STATUS_LABEL[receipt.status] && (
          <Chip color="danger" variant="soft">
            {RECEIPT_STATUS_LABEL[receipt.status]}
          </Chip>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <ul className="divide-y divide-separator">
            {receipt.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="min-w-0 text-foreground">
                  {item.name} <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="shrink-0 text-right tabular-nums text-muted">
                  {Number(item.price) * item.quantity} {receipt.currency}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-center justify-between gap-4 border-t border-separator px-4 py-3 font-semibold">
            <span className="text-foreground">Разом</span>
            <span className="text-right tabular-nums text-accent">
              {Number(receipt.totalAmount)} {receipt.currency}
            </span>
          </p>
        </CardContent>
      </Card>

      {receipt.status === "CONFIRMED" && (
        <p className="mt-4 text-sm text-muted">Оплата та чайові через Google Pay / Apple Pay зʼявляться незабаром</p>
      )}
    </main>
  );
}
