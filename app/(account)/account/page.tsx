import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FR-016: приветствие при первом входе (пока нет ни одного чека).
export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const [receiptsCount, user] = await Promise.all([
    prisma.receipt.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  const isFirstVisit = receiptsCount === 0;

  return (
    <main className="page">
      <h1>Особистий кабінет</h1>
      {isFirstVisit && (
        <p className="text-muted">
          Ласкаво просимо, {session.user.name ?? "гостю"}! Раді бачити вас серед наших гостей 🎉
        </p>
      )}
      {user?.role === "GOLD_MEMBER" && <p className="text-success">Ваш статус: Gold Member ✨</p>}
      <nav style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/account/table" className="pill">
          Мій стіл
        </Link>
        <Link href="/account/receipts" className="pill">
          Мої чеки
        </Link>
        <Link href="/account/bonuses" className="pill">
          Бонуси
        </Link>
        <Link href="/account/profile" className="pill">
          Профіль
        </Link>
      </nav>
    </main>
  );
}
