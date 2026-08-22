import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NewReceiptForm } from "@/components/admin/NewReceiptForm";

export default function NewReceiptPage() {
  return (
    <section className="grid gap-6">
      <AdminPageHeader
        title="Внести чек"
        subtitle="Ручне внесення чека гостя: бонуси нарахуються автоматично за поточною ставкою"
        breadcrumbs={[{ label: "Адміністрування", href: "/admin" }, { label: "Внести чек" }]}
      />
      <NewReceiptForm />
    </section>
  );
}
