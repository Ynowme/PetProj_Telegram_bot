"use client";

import { useEffect, useState, type FormEvent } from "react";

type RequestType = "TABLE_BOOKING" | "HOOKAH_RENTAL";
type RequestStatus = "PENDING" | "CONFIRMED" | "REJECTED";
type Table = { tableCode: string; open: boolean };

type ServiceRequestItem = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  tableCode: string | null;
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

function TableBookingForm({ onSent }: { onSent: () => void }) {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/account/tables")
      .then((response) => (response.ok ? (response.json() as Promise<Table[]>) : null))
      .then((data) => {
        if (data) setTables(data);
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      setError("Оберіть стіл");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/account/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TABLE_BOOKING", tableCode: selected, comment }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setComment("");
    setSelected(null);
    setSent(true);
    onSent();
  };

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Забронювати стіл</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        {tables === null && <p className="text-muted">Завантаження столів…</p>}
        {tables && tables.length === 0 && <p className="text-muted">Наразі столи не налаштовані.</p>}
        {tables && tables.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tables.map((table) => (
              <button
                key={table.tableCode}
                type="button"
                disabled={table.open}
                onClick={() => {
                  setSelected(table.tableCode);
                  setSent(false);
                }}
                title={table.open ? "Стіл зайнятий" : "Стіл вільний"}
                style={{
                  minWidth: "2.75rem",
                  opacity: table.open ? 0.4 : 1,
                  borderColor: selected === table.tableCode ? "var(--accent)" : undefined,
                }}
              >
                {table.tableCode}
              </button>
            ))}
          </div>
        )}
        <textarea
          placeholder="Побажання (час, кількість гостей тощо) — необов'язково"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
        />
        {error && <p className="text-error">{error}</p>}
        {sent && !error && <p className="text-success">Запит надіслано, персонал зв&apos;яжеться з вами.</p>}
        <button type="submit" disabled={isSubmitting || !selected}>
          {selected ? `Забронювати стіл ${selected}` : "Оберіть стіл вище"}
        </button>
      </form>
    </div>
  );
}

function HookahRentalForm({ onSent }: { onSent: () => void }) {
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
      body: JSON.stringify({ type: "HOOKAH_RENTAL", comment }),
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
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Замовити оренду кальяну</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <textarea
          placeholder="Ваші побажання (смак, час тощо) — необов'язково"
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

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <TableBookingForm onSent={reload} />
      <HookahRentalForm onSent={reload} />

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
                  {item.tableCode ? ` №${item.tableCode}` : ""}
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
