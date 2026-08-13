"use client";

import { useState, type FormEvent } from "react";

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <p style={{ margin: "0 0 0.4rem", fontWeight: 600 }}>{label}</p>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} з 5`}
            aria-pressed={value >= star}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              color: value >= star ? "var(--accent-bright)" : "var(--foreground-muted)",
              borderColor: value >= star ? "var(--accent)" : undefined,
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [dishesRating, setDishesRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wantsContact, setWantsContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (dishesRating === 0 || serviceRating === 0) {
      setError("Будь ласка, натисніть зірочку, щоб оцінити");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishesRating,
        serviceRating,
        comment: comment.trim() || null,
        contactName: wantsContact ? contactName.trim() || null : null,
        contactPhone: wantsContact ? contactPhone.trim() || null : null,
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося надіслати відгук");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="page page--narrow">
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Дякуємо!</h1>
          <p className="text-muted">Ваш відгук надіслано.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--narrow">
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Оцініть нас, будь ласка!</h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
          <StarRating label="Страви" value={dishesRating} onChange={setDishesRating} />
          <StarRating label="Сервіс" value={serviceRating} onChange={setServiceRating} />
          <textarea
            placeholder="Коментар (необов'язково)"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
          />
          <label className="text-muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
            <input type="checkbox" checked={wantsContact} onChange={(event) => setWantsContact(event.target.checked)} style={{ width: "auto" }} />
            Залишити свої контакти
          </label>
          {wantsContact && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <input placeholder="Ім'я" value={contactName} onChange={(event) => setContactName(event.target.value)} />
              <input placeholder="Телефон" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
            </div>
          )}
          {error && <p className="text-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            Надіслати відгук
          </button>
        </form>
      </div>
    </main>
  );
}
