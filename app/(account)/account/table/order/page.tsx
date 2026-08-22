"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Spinner,
  buttonVariants,
  cn,
  toast,
} from "@heroui/react";
import { BackLink } from "@/components/account/BackLink";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";

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
      toast.danger((data?.error?.code && messages[data.error.code]) ?? "Не вдалося надіслати заявку");
      return;
    }

    setCart({});
    setSubmitted(true);
  };

  if (state === "loading") {
    // Skeleton повторює форму готового екрана: заголовок, стрічка категорій, картки позицій
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="mt-3 h-9 w-40 rounded-lg" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  if (state === "blocked") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <BackLink href="/account/table">До столу</BackLink>
        <Card className="mt-4">
          <AccountEmptyState
            title="Замовлення недоступне"
            description="Замовлення доступне лише коли ваша привʼязка до столу підтверджена офіціантом."
          />
        </Card>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
        <Card>
          <CardContent className="grid justify-items-center gap-3 p-8 text-center">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <h1 className="text-2xl font-semibold text-foreground">Заявку надіслано</h1>
            <p className="text-sm text-muted">
              Офіціант побачить її на касі й підтвердить, після чого позиції зʼявляться у вашому рахунку.
            </p>
            <Link
              href="/account/table"
              className={cn(buttonVariants({ variant: "primary" }), "mt-2 min-h-11 active:scale-[0.98]")}
            >
              До столу
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className={`mx-auto w-full max-w-md px-4 py-10 sm:px-6 ${totalCount > 0 ? "pb-28" : ""}`}>
      <BackLink href="/account/table">До столу</BackLink>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">Замовити</h1>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {leaves.map((category) => (
          <Button
            key={category.id}
            type="button"
            size="md"
            variant={category.id === activeCategoryId ? "primary" : "secondary"}
            onPress={() => setActiveCategoryId(category.id)}
            className="min-h-11 shrink-0 rounded-full active:scale-[0.96]"
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {activeItems.length === 0 && (
          <AccountEmptyState
            title="Тут поки порожньо"
            description="У цій категорії немає позицій, доступних для замовлення онлайн"
          />
        )}
        {activeItems.map((item) => {
          const quantity = cart[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="break-words font-medium text-foreground">{item.name}</p>
                <p className="mt-0.5 text-sm tabular-nums text-muted">
                  {item.price} {item.currency}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {quantity > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      isIconOnly
                      aria-label="Менше"
                      onPress={() => setQuantity(item.id, quantity - 1)}
                      className="h-11 w-11 active:scale-[0.94]"
                    >
                      −
                    </Button>
                    <span className="min-w-6 text-center tabular-nums text-foreground">{quantity}</span>
                  </>
                )}
                <Button
                  type="button"
                  variant="primary"
                  isIconOnly
                  aria-label="Додати"
                  onPress={() => setQuantity(item.id, quantity + 1)}
                  className="h-11 w-11 active:scale-[0.94]"
                >
                  +
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {totalCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto w-full max-w-md">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              isPending={isSubmitting}
              onPress={() => void submit()}
              className="min-h-12 active:scale-[0.98]"
            >
              {isSubmitting && <Spinner size="sm" color="current" />}
              <span className="tabular-nums">
                {isSubmitting ? "Надсилаємо..." : `Надіслати замовлення · ${totalCount} · ${totalPrice} ${currency}`}
              </span>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
