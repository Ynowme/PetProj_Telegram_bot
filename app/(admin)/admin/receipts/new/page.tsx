"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Item = { name: string; price: string; quantity: string };

const EMPTY_ITEM: Item = { name: "", price: "", quantity: "1" };

export default function NewReceiptPage() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ totalAmount: number; bonusAmount: number; percentage: number } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    const response = await fetch("/api/admin/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        items: items.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося внести чек");
      return;
    }

    const data = (await response.json()) as { totalAmount: number; bonusAmount: number; percentage: number };
    setResult(data);
    setPhone("");
    setItems([{ ...EMPTY_ITEM }]);
  };

  return (
    <main className="page" style={{ maxWidth: 560 }}>
      <Link href="/admin" className="back-link">
        ← Адміністрування
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Внести чек</h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input
            type="tel"
            placeholder="Телефон гостя"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />

          {items.map((item, index) => (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px auto", gap: "0.5rem" }}>
              <input
                placeholder="Назва позиції"
                value={item.name}
                onChange={(event) => updateItem(index, { name: event.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Ціна"
                min={0}
                step="0.01"
                value={item.price}
                onChange={(event) => updateItem(index, { price: event.target.value })}
                required
              />
              <input
                type="number"
                placeholder="К-сть"
                min={1}
                value={item.quantity}
                onChange={(event) => updateItem(index, { quantity: event.target.value })}
                required
              />
              <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1}>
                ✕
              </button>
            </div>
          ))}

          <button type="button" onClick={addItem}>
            + Додати позицію
          </button>

          {error && <p className="text-error">{error}</p>}
          {result && (
            <p className="text-success">
              Чек внесено: {result.totalAmount} ₴, нараховано бонусів: {result.bonusAmount} ₴ ({result.percentage}%)
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            Зберегти чек
          </button>
        </form>
      </div>
    </main>
  );
}
