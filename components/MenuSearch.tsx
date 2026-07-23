"use client";

import { useEffect, useState } from "react";
import type { SerializedMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; items: SerializedMenuItem[] };

// FR-019: фильтрация результатов по мере ввода запроса (debounce 300мс).
export function MenuSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      fetch(`/api/menu/items?search=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Search request failed");
          return response.json() as Promise<{ items: SerializedMenuItem[] }>;
        })
        .then((data: { items: SerializedMenuItem[] }) => {
          setState({ status: "done", items: data.items });
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") {
            setState({ status: "done", items: [] });
          }
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setState(value.trim() ? { status: "loading" } : { status: "idle" });
  };

  const trimmedQuery = query.trim();

  return (
    <div style={{ marginBottom: "2rem" }}>
      <input
        type="search"
        placeholder="Пошук по меню…"
        value={query}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "0.6rem 0.9rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "inherit",
        }}
      />

      {trimmedQuery && (
        <div style={{ marginTop: "0.75rem" }}>
          {state.status !== "done" && <p>Шукаємо…</p>}
          {state.status === "done" && state.items.length === 0 && <p>Нічого не знайдено.</p>}
          {state.status === "done" && state.items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {state.items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
