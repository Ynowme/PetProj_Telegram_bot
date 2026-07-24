import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="page page--narrow">
      <h1>Адміністрування</h1>
      <nav style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
        <Link href="/admin/users" className="panel">
          Гості
        </Link>
        <Link href="/admin/bonus-settings" className="panel">
          Ставка бонусів
        </Link>
        <Link href="/admin/receipts/new" className="panel">
          Внести чек
        </Link>
        <Link href="/admin/table-sessions" className="panel">
          Запити на прив&apos;язку до столу
        </Link>
      </nav>
    </main>
  );
}
