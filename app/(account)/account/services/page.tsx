import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestsPanel } from "@/components/ServiceRequestsPanel";

// Послуги (бронювання столу, оренда кальяну) доступні лише Gold Member.
export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isGold = user?.role === "GOLD_MEMBER";

  return (
    <main className="page page--narrow">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <h1>Послуги</h1>

      {isGold ? (
        <ServiceRequestsPanel />
      ) : (
        <p className="text-muted">
          Ця сторінка доступна лише Gold Member. Gold Member присвоюється автоматично після 7 підтверджених
          чеків за календарний місяць.
        </p>
      )}
    </main>
  );
}
