"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PendingSession = {
  id: string;
  tableCode: string;
  requestedAt: string;
  guest: { id: string; name: string; telegramUsername: string | null; phone: string | null };
};

export default function AdminTableSessionsPage() {
  const [items, setItems] = useState<PendingSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/table-sessions")
      .then((response) => (response.ok ? (response.json() as Promise<PendingSession[]>) : null))
      .then((data) => {
        if (data) setItems(data);
      });
  }, [reloadKey]);

  const act = async (id: string, action: "confirm" | "reject") => {
    setError(null);
    const response = await fetch(`/api/admin/table-sessions/${id}/${action}`, { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося виконати дію");
      return;
    }
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <Link href="/admin" className="back-link">
        ← Адміністрування
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Запити на прив&apos;язку до столу</h1>

        {error && <p className="text-error">{error}</p>}

        {items === null && <p className="text-muted">Завантаження…</p>}
        {items?.length === 0 && <p className="text-muted">Немає запитів, що очікують підтвердження.</p>}

        {items && items.length > 0 && (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {items.map((item) => (
              <div key={item.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <strong>Стіл {item.tableCode}</strong>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {item.guest.name}
                    {item.guest.telegramUsername ? ` (@${item.guest.telegramUsername})` : ""}
                    {item.guest.phone ? ` · ${item.guest.phone}` : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={() => act(item.id, "confirm")}>
                    Підтвердити
                  </button>
                  <button type="button" onClick={() => act(item.id, "reject")}>
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
