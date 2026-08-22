import { Card } from "@heroui/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestsPanel } from "@/components/ServiceRequestsPanel";
import { BackLink } from "@/components/account/BackLink";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";

// Послуги (бронювання столу, оренда кальяну) доступні лише Gold Member.
export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user?.id) return null; // защищено proxy.ts

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const isGold = user?.role === "GOLD_MEMBER";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <BackLink href="/account">Кабінет</BackLink>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">Послуги</h1>

      <div className="mt-6">
        {isGold ? (
          <ServiceRequestsPanel />
        ) : (
          <Card>
            <AccountEmptyState
              title="Доступно лише Gold Member"
              description="Статус присвоюється автоматично після 7 підтверджених чеків за календарний місяць."
            />
          </Card>
        )}
      </div>
    </main>
  );
}
