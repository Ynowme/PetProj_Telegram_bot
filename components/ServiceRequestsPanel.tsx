"use client";

import { useEffect, useState, type FormEvent } from "react";

type RequestType = "TABLE_BOOKING" | "HOOKAH_RENTAL";
type RequestStatus = "PENDING" | "CONFIRMED" | "REJECTED";

type ServiceRequestItem = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  comment: string | null;
  requestedAt: string;
};

const TYPE_LABEL: Record<RequestType, string> = {
  TABLE_BOOKING: "Бронювання столу",
  HOOKAH_RENTAL: "Оренда кальяну",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "Очікує підтвердження",
  CONFIRMED: "Підтверджено",
  REJECTED: "Відхилено",
};

function RequestForm({ type, title, onSent }: { type: RequestType; title: string; onSent: () => void }) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/account/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, comment }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setComment("");
    setSent(true);
    onSent();
  };

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{title}</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <textarea
          placeholder="Ваші побажання (час, кількість гостей тощо) — необов'язково"
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setSent(false);
          }}
          rows={3}
        />
        {error && <p className="text-error">{error}</p>}
        {sent && !error && <p className="text-success">Запит надіслано, персонал зв&apos;яжеться з вами.</p>}
        <button type="submit" disabled={isSubmitting}>
          Відправити запит
        </button>
      </form>
    </div>
  );
}

export function ServiceRequestsPanel() {
  const [history, setHistory] = useState<ServiceRequestItem[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/account/service-requests")
      .then((response) => (response.ok ? (response.json() as Promise<ServiceRequestItem[]>) : null))
      .then((data) => {
        if (data) setHistory(data);
      });
  }, [reloadKey]);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <RequestForm
        type="TABLE_BOOKING"
        title="Забронювати стіл"
        onSent={() => setReloadKey((key) => key + 1)}
      />
      <RequestForm
        type="HOOKAH_RENTAL"
        title="Замовити оренду кальяну"
        onSent={() => setReloadKey((key) => key + 1)}
      />

      {history && history.length > 0 && (
        <div className="panel">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Ваші запити</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem", margin: 0 }}>
            {history.map((item) => (
              <li
                key={item.id}
                style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
              >
                <span>
                  {TYPE_LABEL[item.type]}
                  {item.comment ? ` — ${item.comment}` : ""}
                </span>
                <span className="text-muted">{STATUS_LABEL[item.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
