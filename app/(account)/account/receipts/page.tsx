import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECEIPT_STATUS_LABEL } from "@/lib/receipts";

// FR-007, FR-016: история чеков; пусто при первом входе — без ошибки.
export default async function ReceiptsPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return (
    <main className="page">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <h1>Мої чеки</h1>

      {receipts.length === 0 ? (
        <p className="text-muted">У вас поки немає чеків.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <Link href={`/account/receipts/${receipt.id}`} className="panel" style={{ display: "block" }}>
                {new Intl.DateTimeFormat("uk-UA").format(receipt.date)} —{" "}
                <strong style={{ color: "var(--accent-bright)" }}>
                  {Number(receipt.totalAmount)} {receipt.currency}
                </strong>
                {RECEIPT_STATUS_LABEL[receipt.status] && (
                  <span className="text-muted"> · {RECEIPT_STATUS_LABEL[receipt.status]}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
