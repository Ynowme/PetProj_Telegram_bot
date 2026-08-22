import type { ReactNode } from "react";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";

// Єдиний каркас адмінки: контейнер однієї ширини + вкладки розділів на кожній сторінці.
// Раніше кожна сторінка сама верстала <main class="page"> зі своєю шириною і back-link,
// через що перехід між розділами відчувався як стрибок між різними сайтами.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8">
      <AdminNavTabs />
      {children}
    </main>
  );
}
