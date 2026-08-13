"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Review = {
  id: string;
  dishesRating: number;
  serviceRating: number;
  comment: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  guest: { id: string; name: string; telegramUsername: string | null; phone: string | null } | null;
};

function Stars({ value }: { value: number }) {
  return <span aria-label={`${value} з 5`}>{"★".repeat(value)}{"☆".repeat(5 - value)}</span>;
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((response) => (response.ok ? (response.json() as Promise<Review[]>) : null))
      .then((data) => {
        if (data) setItems(data);
      });
  }, []);

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <Link href="/admin" className="back-link">
        ← Адміністрування
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Відгуки гостей</h1>

        {items === null && <p className="text-muted">Завантаження…</p>}
        {items?.length === 0 && <p className="text-muted">Ще немає жодного відгуку.</p>}

        {items && items.length > 0 && (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {items.map((item) => {
              const who = item.contactName || item.guest?.name;
              const phone = item.contactPhone || item.guest?.phone;
              return (
                <div key={item.id} className="panel">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ margin: 0 }}>
                        Страви: <Stars value={item.dishesRating} /> &nbsp; Сервіс: <Stars value={item.serviceRating} />
                      </p>
                      {(who || phone) && (
                        <p className="text-muted" style={{ margin: "0.25rem 0 0" }}>
                          {who}
                          {phone ? ` · ${phone}` : ""}
                          {item.guest?.telegramUsername ? ` (@${item.guest.telegramUsername})` : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                      {new Date(item.createdAt).toLocaleString("uk-UA")}
                    </span>
                  </div>
                  {item.comment && <p style={{ margin: "0.5rem 0 0" }}>{item.comment}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
