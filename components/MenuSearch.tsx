"use client";

import { useEffect, useState } from "react";
import { EmptyState, SearchField, Skeleton } from "@heroui/react";
import type { SerializedMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; items: SerializedMenuItem[] };

// Скелетон повторює геометрію рядкової MenuItemCard (фото зліва + два рядки тексту),
// щоб список не "стрибав" при заміні на реальні результати.
function ResultSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
      <Skeleton className="size-24 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-1">
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

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

  const handleChange = (value: string) => {
    setQuery(value);
    setState(value.trim() ? { status: "loading" } : { status: "idle" });
  };

  const trimmedQuery = query.trim();

  return (
    <div className="mb-8">
      <SearchField value={query} onChange={handleChange} fullWidth aria-label="Пошук по меню">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Пошук по меню…" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {trimmedQuery && (
        <div className="mt-3">
          {state.status !== "done" && (
            <div className="flex flex-col gap-3">
              <ResultSkeleton />
              <ResultSkeleton />
            </div>
          )}
          {state.status === "done" && state.items.length === 0 && (
            <EmptyState className="rounded-2xl border border-dashed border-border py-8 text-center">
              Нічого не знайдено. Спробуйте інший запит.
            </EmptyState>
          )}
          {state.status === "done" && state.items.length > 0 && (
            <div className="flex flex-col gap-3">
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
