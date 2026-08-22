import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BonusSettingsForm } from "@/components/admin/BonusSettingsForm";

export default function BonusSettingsPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Ставка бонусів"
        subtitle="Відсоток від суми чека, що нараховується гостю бонусами"
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Ставка бонусів" }]}
      />
      <BonusSettingsForm />
    </section>
  );
}
