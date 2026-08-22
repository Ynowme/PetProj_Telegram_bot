"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PendingRequestsPanel, type PendingRequestItem } from "@/components/admin/PendingRequestsPanel";

type RequestType = "TABLE_BOOKING" | "HOOKAH_RENTAL";

type PendingServiceRequest = PendingRequestItem & { type: RequestType; tableCode: string | null };

const TYPE_LABEL: Record<RequestType, string> = {
  TABLE_BOOKING: "Бронювання столу",
  HOOKAH_RENTAL: "Оренда кальяну",
};

export default function AdminServiceRequestsPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Запити на послуги"
        subtitle="Бронювання столів та оренда кальяну, що очікують підтвердження"
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Запити на послуги" }]}
      />
      <PendingRequestsPanel<PendingServiceRequest>
        endpoint="/api/admin/service-requests"
        titleFor={(item) => `${TYPE_LABEL[item.type]}${item.tableCode ? ` №${item.tableCode}` : ""}`}
        emptyTitle="Немає запитів, що очікують підтвердження"
        confirmToast="Запит підтверджено"
        rejectToast="Запит відхилено"
      />
    </section>
  );
}
