"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MenuCategory = { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] };
type MenuItem = { id: string; categoryId: string; name: string; price: number; currency: string; photoUrl: string; orderable: boolean };

type LoadState = "loading" | "ready" | "blocked";

// Плоский список "листових" категорій — той самий принцип, що category-grid на /menu:
// підкатегорії, якщо є, інакше сама категорія верхнього рівня.
function leafCategories(categories: MenuCategory[]): { id: string; name: string }[] {
  return categories.flatMap((category) =>
    category.children.length > 0 ? category.children.map((child) => ({ id: child.id, name: child.name })) : [{ id: category.id, name: category.name }],
  );
}

// Гість зі столу (TableSession CONFIRMED, guestOrderingEnabled) сам збирає кошик тут — без
// модифікаторів/коментаря (MVP, як в плані): офіціант підтверджує заявку в касі
// (components/OrderScreen.tsx), лише тоді позиції потрапляють у чек.
export default function TableOrderPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [sessionRes, categoriesRes, itemsRes] = await Promise.all([
        fetch("/api/account/table-session"),
        fetch("/api/menu/categories"),
        fetch("/api/menu/items"),
      ]);
      if (cancelled) return;

      const session = sessionRes.ok ? ((await sessionRes.json()) as { status: string }) : null;
      if (session?.status !== "CONFIRMED") {
        setState("blocked");
        return;
      }

      const categoriesData = categoriesRes.ok ? ((await categoriesRes.json()) as { categories: MenuCategory[] }).categories : [];
      const itemsData = itemsRes.ok ? ((await itemsRes.json()) as { items: MenuItem[] }).items : [];

      setCategories(categoriesData);
      setItems(itemsData.filter((item) => item.orderable));
      const leaves = leafCategories(categoriesData);
      setActiveCategoryId(leaves[0]?.id ?? null);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const leaves = useMemo(() => leafCategories(categories), [categories]);
  const activeItems = useMemo(() => items.filter((item) => item.categoryId === activeCategoryId), [items, activeCategoryId]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const cartLines = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  const totalCount = cartLines.reduce((sum, [, quantity]) => sum + quantity, 0);
  const totalPrice = cartLines.reduce((sum, [id, quantity]) => sum + (itemById.get(id)?.price ?? 0) * quantity, 0);
  const currency = items[0]?.currency ?? "грн";

  const setQuantity = (menuItemId: string, quantity: number) => {
    setCart((prev) => ({ ...prev, [menuItemId]: Math.max(0, Math.min(20, quantity)) }));
  };

  const submit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    const response = await fetch("/api/account/table-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartLines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })) }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
      const messages: Record<string, string> = {
        NO_ACTIVE_TABLE_SESSION: "Прив'язку до столу вже завершено, оновіть сторінку",
        EMPTY_CART: "Кошик порожній",
        MENU_ITEM_NOT_FOUND: "Одна з позицій більше не доступна, оновіть сторінку",
        MENU_ITEM_NOT_ORDERABLE: "Одна з позицій наразі недоступна для замовлення онлайн",
        RATE_LIMITED: "Забагато заявок поспіль, спробуйте трохи пізніше",
      };
      setSubmitError((data?.error?.code && messages[data.error.code]) ?? "Не вдалося надіслати заявку");
      return;
    }

    setCart({});
    setSubmitted(true);
  };

  if (state === "loading") {
    return (
      <main className="page page--narrow">
        <p className="text-muted">Завантаження…</p>
      </main>
    );
  }

  if (state === "blocked") {
    return (
      <main className="page page--narrow">
        <Link href="/account/table" className="back-link">
          ← До столу
        </Link>
        <div className="panel">
          <p className="text-muted">Замовлення доступне лише коли ваша привʼязка до столу підтверджена офіціантом.</p>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="page page--narrow">
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Заявку надіслано</h1>
          <p className="text-muted">Офіціант побачить її на касі й підтвердить — позиції зʼявляться у вашому рахунку.</p>
          <Link href="/account/table" className="pill pill--accent" style={{ marginTop: "1rem" }}>
            До столу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--narrow" style={{ paddingBottom: totalCount > 0 ? "5rem" : undefined }}>
      <Link href="/account/table" className="back-link">
        ← До столу
      </Link>
      <h1>Замовити</h1>

      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {leaves.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategoryId(category.id)}
            className={category.id === activeCategoryId ? "pill pill--accent" : "pill"}
            style={{ flexShrink: 0 }}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
        {activeItems.length === 0 && <p className="text-muted">У цій категорії немає позицій, доступних для замовлення онлайн.</p>}
        {activeItems.map((item) => {
          const quantity = cart[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="panel"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem" }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, overflowWrap: "break-word" }}>{item.name}</p>
                <p className="text-muted" style={{ margin: "0.2rem 0 0" }}>
                  {item.price} {item.currency}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {quantity > 0 && (
                  <>
                    <button type="button" className="pill" onClick={() => setQuantity(item.id, quantity - 1)} aria-label="Менше">
                      −
                    </button>
                    <span style={{ minWidth: "1.5rem", textAlign: "center" }}>{quantity}</span>
                  </>
                )}
                <button type="button" className="pill pill--accent" onClick={() => setQuantity(item.id, quantity + 1)} aria-label="Додати">
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalCount > 0 && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "1rem",
            background: "rgba(10, 11, 14, 0.96)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          {submitError && <p className="text-error" style={{ margin: 0 }}>{submitError}</p>}
          <button
            type="button"
            className="pill pill--accent"
            disabled={isSubmitting}
            onClick={() => void submit()}
            style={{ width: "min(420px, 100%)", justifyContent: "center" }}
          >
            {isSubmitting ? "Надсилаємо…" : `Надіслати замовлення · ${totalCount} · ${totalPrice} ${currency}`}
          </button>
        </div>
      )}
    </main>
  );
}
