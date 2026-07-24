"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RequestType = "TABLE_BOOKING" | "HOOKAH_RENTAL";

type PendingRequest = {
  id: string;
  type: RequestType;
  comment: string | null;
  requestedAt: string;
  guest: { id: string; name: string; telegramUsername: string | null; phone: string | null };
};

const TYPE_LABEL: Record<RequestType, string> = {
  TABLE_BOOKING: "Бронювання столу",
  HOOKAH_RENTAL: "Оренда кальяну",
};

export default function AdminServiceRequestsPage() {
  const [items, setItems] = useState<PendingRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/service-requests")
      .then((response) => (response.ok ? (response.json() as Promise<PendingRequest[]>) : null))
      .then((data) => {
        if (data) setItems(data);
      });
  }, [reloadKey]);

  const act = async (id: string, action: "confirm" | "reject") => {
    setError(null);
    const response = await fetch(`/api/admin/service-requests/${id}/${action}`, { method: "POST" });
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
        <h1 style={{ marginTop: 0 }}>Запити на послуги</h1>

        {error && <p className="text-error">{error}</p>}

        {items === null && <p className="text-muted">Завантаження…</p>}
        {items?.length === 0 && <p className="text-muted">Немає запитів, що очікують підтвердження.</p>}

        {items && items.length > 0 && (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="panel"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
              >
                <div>
                  <strong>{TYPE_LABEL[item.type]}</strong>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {item.guest.name}
                    {item.guest.telegramUsername ? ` (@${item.guest.telegramUsername})` : ""}
                    {item.guest.phone ? ` · ${item.guest.phone}` : ""}
                  </p>
                  {item.comment && <p style={{ margin: "0.25rem 0 0" }}>{item.comment}</p>}
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
