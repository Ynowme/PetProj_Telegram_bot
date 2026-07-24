import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";

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
    <main className="page">
      <Link href="/account/receipts" className="back-link">
        ← Мої чеки
      </Link>
      <h1>Чек від {new Intl.DateTimeFormat("uk-UA").format(receipt.date)}</h1>
      {RECEIPT_STATUS_LABEL[receipt.status] && <p className="text-muted">{RECEIPT_STATUS_LABEL[receipt.status]}</p>}

      <div className="panel">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {receipt.items.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.4rem 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                {Number(item.price) * item.quantity} {receipt.currency}
              </span>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "1rem", marginBottom: 0, fontWeight: 700, color: "var(--accent-bright)" }}>
          Разом: {Number(receipt.totalAmount)} {receipt.currency}
        </p>
      </div>

      {receipt.status === "CONFIRMED" && (
        <p className="text-muted" style={{ marginTop: "1rem" }}>
          Оплата та чайові через Google Pay / Apple Pay — скоро
        </p>
      )}
    </main>
  );
}
