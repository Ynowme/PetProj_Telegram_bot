"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PendingRequestsPanel, type PendingRequestItem } from "@/components/admin/PendingRequestsPanel";

type PendingSession = PendingRequestItem & { tableCode: string };

export default function AdminTableSessionsPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Привʼязка до столу"
        subtitle="Запити гостей на привʼязку до столу за QR-кодом"
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Привʼязка до столу" }]}
      />
      <PendingRequestsPanel<PendingSession>
        endpoint="/api/admin/table-sessions"
        titleFor={(item) => `Стіл ${item.tableCode}`}
        emptyTitle="Немає запитів, що очікують підтвердження"
        confirmToast="Гостя привʼязано до столу"
        rejectToast="Запит відхилено"
      />
    </section>
  );
}
