import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReviewsPanel } from "@/components/admin/ReviewsPanel";

export default function AdminReviewsPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Відгуки гостей"
        subtitle="Оцінки страв і сервісу з форми зворотного звʼязку, найновіші першими"
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Відгуки гостей" }]}
      />
      <ReviewsPanel />
    </section>
  );
}
