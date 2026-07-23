"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

export default function BonusSettingsPage() {
  const [percentage, setPercentage] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bonus-settings")
      .then((response) => response.json())
      .then((data: { percentage: number }) => {
        setPercentage(String(data.percentage));
        setStatus("idle");
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const response = await fetch("/api/admin/bonus-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentage: Number(percentage) }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося зберегти");
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
      <Link href="/admin" className="back-link">
        ← Адміністрування
      </Link>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Ставка бонусів</h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label>
            Відсоток від суми чека
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: "0.3rem" }}
            />
          </label>
          {error && <p className="text-error">{error}</p>}
          {status === "saved" && <p className="text-success">Збережено.</p>}
          <button type="submit" disabled={status === "saving"}>
            Зберегти
          </button>
        </form>
      </div>
    </main>
  );
}
