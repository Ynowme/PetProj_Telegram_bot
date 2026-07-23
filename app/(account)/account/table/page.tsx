"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type TableStatus = {
  status: "NONE" | "PENDING_STAFF_CONFIRMATION" | "CONFIRMED" | "REJECTED" | "CLOSED";
  tableCode?: string;
};

const STATUS_LABEL: Record<TableStatus["status"], string> = {
  NONE: "Ви ще не прив&apos;язані до столу",
  PENDING_STAFF_CONFIRMATION: "Очікує підтвердження офіціантом",
  CONFIRMED: "Прив&apos;язку підтверджено — чеки цього столу зʼявляться тут автоматично",
  REJECTED: "Запит відхилено, спробуйте ще раз або зверніться до персоналу",
  CLOSED: "Стіл закрито",
};

export default function TablePage() {
  const [tableCode, setTableCode] = useState("");
  const [status, setStatus] = useState<TableStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/account/table-session")
      .then((response) => (response.ok ? (response.json() as Promise<TableStatus>) : null))
      .then((data) => {
        if (data) setStatus(data);
      });
  }, [reloadKey]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/account/table-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableCode }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setTableCode("");
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="page page--narrow">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Прив&apos;язка до столу</h1>

        {status && <p className="text-muted">{STATUS_LABEL[status.status]}</p>}

        {(!status || status.status === "NONE" || status.status === "REJECTED" || status.status === "CLOSED") && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <input
              placeholder="Код столу (з QR-наклейки)"
              value={tableCode}
              onChange={(event) => setTableCode(event.target.value)}
              required
            />
            {error && <p className="text-error">{error}</p>}
            <button type="submit" disabled={isSubmitting}>
              Запросити прив&apos;язку
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
