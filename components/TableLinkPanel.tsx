"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type ReceiptItem = { name: string; price: number; quantity: number };
type Receipt = { id: string; date: string; totalAmount: number; currency: string; items: ReceiptItem[] };

type TableStatus = {
  status: "NONE" | "PENDING_STAFF_CONFIRMATION" | "CONFIRMED" | "REJECTED" | "CLOSED";
  tableCode?: string;
  receipts?: Receipt[];
};

const STATUS_LABEL: Record<TableStatus["status"], string> = {
  NONE: "Ви ще не прив&apos;язані до столу",
  PENDING_STAFF_CONFIRMATION: "Очікує підтвердження офіціантом",
  CONFIRMED: "Прив&apos;язку підтверджено — чеки цього столу зʼявляться тут автоматично",
  REJECTED: "Запит відхилено, спробуйте ще раз або зверніться до персоналу",
  CLOSED: "Стіл закрито",
};

const CAN_REQUEST = new Set<TableStatus["status"]>(["NONE", "REJECTED", "CLOSED"]);

// Спільна логіка привʼязки гостя до столу — використовується і на /account/table (гість вручну
// вводить код), і на /t/[code] (код прийшов із QR-наклейки на столі, initialCode одразу
// підставляється й автоматично надсилається, щоб не змушувати гостя передруковувати його).
export function TableLinkPanel({ initialCode }: { initialCode?: string }) {
  const [tableCode, setTableCode] = useState(initialCode ?? "");
  const [status, setStatus] = useState<TableStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    fetch("/api/account/table-session")
      .then((response) => (response.ok ? (response.json() as Promise<TableStatus>) : null))
      .then((data) => {
        if (data) setStatus(data);
      });
  }, [reloadKey]);

  const submit = async (code: string) => {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/account/table-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableCode: code }),
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

  useEffect(() => {
    if (!initialCode || autoSubmitted.current || status === null) return;
    if (!CAN_REQUEST.has(status.status)) return;
    autoSubmitted.current = true;
    // queueMicrotask — submit() одразу виставляє setIsSubmitting/setError, а виклик setState
    // прямо в тілі ефекту небажаний (react-hooks/set-state-in-effect); мікротаска розриває цей
    // синхронний ланцюжок, не міняючи фактичного моменту відправки (усе ще до наступного фарбування).
    queueMicrotask(() => void submit(initialCode));
  }, [initialCode, status]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(tableCode);
  };

  return (
    <div className="panel">
      <h1 style={{ marginTop: 0 }}>Прив&apos;язка до столу</h1>

      {status && <p className="text-muted">{STATUS_LABEL[status.status]}</p>}

      {status?.status === "CONFIRMED" && (
        <div style={{ marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem" }}>Поточний рахунок</h2>
          {!status.receipts || status.receipts.length === 0 ? (
            <p className="text-muted">Ще немає жодного пробитого чека на цей стіл.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {status.receipts.map((receipt) => (
                <div key={receipt.id} className="panel">
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.25rem" }}>
                    {receipt.items.map((item, index) => (
                      <li key={index} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                        <span>
                          {item.name}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                        </span>
                        <span className="text-muted">
                          {item.price * item.quantity} {receipt.currency}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: "0.5rem 0 0", textAlign: "right" }}>
                    <strong>
                      {receipt.totalAmount} {receipt.currency}
                    </strong>
                  </p>
                </div>
              ))}
              <p style={{ textAlign: "right", margin: 0 }}>
                Разом:{" "}
                <strong style={{ color: "var(--accent-bright)" }}>
                  {status.receipts.reduce((sum, r) => sum + r.totalAmount, 0)} {status.receipts[0].currency}
                </strong>
              </p>
            </div>
          )}
        </div>
      )}

      {status && CAN_REQUEST.has(status.status) && (
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
  );
}
