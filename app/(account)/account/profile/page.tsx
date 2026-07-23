"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type ProfileForm = { name: string; email: string; phone: string };

// FR-024: редактирование профиля (имя/email/телефон).
export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((response) => response.json())
      .then((data: ProfileForm) => {
        setForm({ name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "" });
        setStatus("idle");
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (response.status === 409) {
      setError("Користувач вже зареєстрований");
      setStatus("idle");
      return;
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося зберегти зміни");
      setStatus("idle");
      return;
    }

    setStatus("saved");
  };

  if (status === "loading")
    return (
      <main className="page page--narrow">
        <p className="text-muted">Завантаження…</p>
      </main>
    );

  return (
    <main className="page page--narrow">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Профіль</h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input
            placeholder="Ім'я"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />

          {error && <p className="text-error">{error}</p>}
          {status === "saved" && <p className="text-success">Зміни збережено.</p>}
          <button type="submit" disabled={status === "saving"}>
            Зберегти
          </button>
        </form>
      </div>
    </main>
  );
}
