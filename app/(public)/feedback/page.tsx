"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Checkbox, EmptyState, Input, Label, Spinner, TextArea, TextField, toast } from "@heroui/react";

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 mt-0 font-semibold text-foreground">{label}</p>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} з 5`}
            aria-pressed={value >= star}
            className={`flex size-11 items-center justify-center rounded-full border text-xl transition active:scale-[0.95] ${
              value >= star ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-muted hover:bg-surface-hover"
            }`}
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

    toast.success("Дякуємо! Ваш відгук надіслано.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-10">
        <Card>
          <EmptyState className="py-6 text-center">
            <p className="m-0 text-3xl" aria-hidden>
              ★
            </p>
            <h1 className="mb-1 mt-2 text-xl font-semibold text-foreground">Дякуємо!</h1>
            <p className="m-0 text-muted">Ваш відгук надіслано.</p>
          </EmptyState>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <Card>
        <h1 className="mb-5 mt-0 text-2xl font-semibold tracking-tight text-foreground">Оцініть нас, будь ласка!</h1>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <StarRating label="Страви" value={dishesRating} onChange={setDishesRating} />
          <StarRating label="Сервіс" value={serviceRating} onChange={setServiceRating} />

          <TextField value={comment} onChange={setComment}>
            <Label>Коментар (необов&apos;язково)</Label>
            <TextArea rows={4} placeholder="Поділіться враженнями" />
          </TextField>

          <Checkbox isSelected={wantsContact} onChange={setWantsContact}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>Залишити свої контакти</Label>
            </Checkbox.Content>
          </Checkbox>

          {wantsContact && (
            <div className="grid gap-3">
              <TextField value={contactName} onChange={setContactName}>
                <Label>Ім&apos;я</Label>
                <Input placeholder="Як до вас звертатись" />
              </TextField>
              <TextField value={contactPhone} onChange={setContactPhone} type="tel">
                <Label>Телефон</Label>
                <Input placeholder="+380..." inputMode="tel" />
              </TextField>
            </div>
          )}

          {error && <p className="m-0 text-sm text-danger">{error}</p>}

          {/* bg-accent!/text-accent-foreground! — тимчасовий міст: легасі-правило
              button[type="submit"] у globals.css (unlayered) інакше перекриває primary-варіант
              білим по білому; після вичистки globals.css класи стануть просто надлишковими. */}
          <Button type="submit" variant="primary" fullWidth isDisabled={isSubmitting} className="min-h-11 bg-accent! text-accent-foreground!">
            {isSubmitting && <Spinner size="sm" />}
            Надіслати відгук
          </Button>
        </form>
      </Card>
    </main>
  );
}
