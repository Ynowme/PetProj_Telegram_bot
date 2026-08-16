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
      <nav className="category-grid" style={{ marginTop: "1.5rem" }}>
        <Link href="/account/table" className="category-block">
          Мій стіл
        </Link>
        <Link href="/account/bonuses" className="category-block">
          Бонуси
        </Link>
        <Link href="/account/receipts" className="category-block">
          Історія чеків
        </Link>
        {user?.role === "GOLD_MEMBER" && (
          <Link href="/account/services" className="category-block">
            Послуги
          </Link>
        )}
        <Link href="/account/profile" className="category-block">
          Профіль
        </Link>
        <Link href="/menu/favorites" className="category-block">
          Обрані
        </Link>
        <Link href="/feedback" className="category-block">
          Залишити відгук
        </Link>
      </nav>
    </main>
  );
}
