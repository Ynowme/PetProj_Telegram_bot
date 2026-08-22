"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Label,
  Skeleton,
  Spinner,
  TextField,
  buttonVariants,
  cn,
  toast,
} from "@heroui/react";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";

type ReceiptItem = { name: string; price: number; quantity: number };
type Receipt = { id: string; date: string; totalAmount: number; currency: string; items: ReceiptItem[] };

type TableStatus = {
  status: "NONE" | "PENDING_STAFF_CONFIRMATION" | "CONFIRMED" | "REJECTED" | "CLOSED";
  tableCode?: string;
  receipts?: Receipt[];
};

// Статус привʼязки: Chip дає миттєве зчитування стану, опис нижче пояснює, що робити далі.
const STATUS_VIEW: Record<
  TableStatus["status"],
  { chip: string; color: "default" | "warning" | "success" | "danger"; description: string }
> = {
  NONE: {
    chip: "Не прив'язано",
    color: "default",
    description: "Введіть код столу з QR-наклейки, щоб бачити свій рахунок онлайн.",
  },
  PENDING_STAFF_CONFIRMATION: {
    chip: "Очікує підтвердження",
    color: "warning",
    description: "Запит надіслано, офіціант підтвердить прив'язку найближчим часом.",
  },
  CONFIRMED: {
    chip: "Підтверджено",
    color: "success",
    description: "Чеки цього столу з'являться тут автоматично.",
  },
  REJECTED: {
    chip: "Відхилено",
    color: "danger",
    description: "Запит відхилено, спробуйте ще раз або зверніться до персоналу.",
  },
  CLOSED: {
    chip: "Стіл закрито",
    color: "default",
    description: "Сесію столу завершено. За потреби прив'яжіться до столу знову.",
  },
};

const CAN_REQUEST = new Set<TableStatus["status"]>(["NONE", "REJECTED", "CLOSED"]);

// Спільна логіка привʼязки гостя до столу — використовується і на /account/table (гість вручну
// вводить код), і на /t/[code] (код прийшов із QR-наклейки на столі, initialCode одразу
// підставляється й автоматично надсилається, щоб не змушувати гостя передруковувати його).
export function TableLinkPanel({ initialCode }: { initialCode?: string }) {
  const [tableCode, setTableCode] = useState(initialCode ?? "");
  const [status, setStatus] = useState<TableStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [guestOrderingEnabled, setGuestOrderingEnabled] = useState(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    fetch("/api/account/table-session")
      .then((response) => (response.ok ? (response.json() as Promise<TableStatus>) : null))
      .then((data) => {
        if (data) setStatus(data);
      });
  }, [reloadKey]);

  useEffect(() => {
    fetch("/api/site-content")
      .then((response) => (response.ok ? (response.json() as Promise<{ guestOrderingEnabled?: boolean | null }>) : null))
      .then((data) => setGuestOrderingEnabled(Boolean(data?.guestOrderingEnabled)));
  }, []);

  const submit = async (code: string) => {
    setIsSubmitting(true);

    const response = await fetch("/api/account/table-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableCode: code }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setTableCode("");
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    if (!initialCode || autoSubmitted.current || status === null) return;
    if (!CAN_REQUEST.has(status.status)) return;
    autoSubmitted.current = true;
    // queueMicrotask — submit() одразу виставляє setIsSubmitting, а виклик setState
    // прямо в тілі ефекту небажаний (react-hooks/set-state-in-effect); мікротаска розриває цей
    // синхронний ланцюжок, не міняючи фактичного моменту відправки (усе ще до наступного фарбування).
    queueMicrotask(() => void submit(initialCode));
  }, [initialCode, status]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(tableCode);
  };

  const view = status ? STATUS_VIEW[status.status] : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Прив&apos;язка до столу</h1>
          {view && (
            <Chip color={view.color} variant="soft">
              {view.chip}
            </Chip>
          )}
        </div>

        {view ? (
          <p className="mt-2 text-sm text-muted">{view.description}</p>
        ) : (
          <Skeleton className="mt-3 h-4 w-64 rounded" />
        )}

        {status?.status === "CONFIRMED" && guestOrderingEnabled && (
          <Link
            href="/account/table/order"
            className={cn(
              buttonVariants({ variant: "primary" }),
              "mt-4 min-h-11 active:scale-[0.98]",
            )}
          >
            Замовити
          </Link>
        )}

        {status?.status === "CONFIRMED" && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-foreground">Поточний рахунок</h2>
            {!status.receipts || status.receipts.length === 0 ? (
              <AccountEmptyState
                title="Ще немає жодного пробитого чека"
                description="Щойно офіціант пробʼє чек на цей стіл, він зʼявиться тут"
              />
            ) : (
              <div className="mt-3 grid gap-3">
                {status.receipts.map((receipt) => (
                  <div key={receipt.id} className="rounded-2xl border border-border bg-surface-secondary p-4">
                    <ul className="grid gap-1.5">
                      {receipt.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-4 text-sm">
                          <span className="min-w-0 text-foreground">
                            {item.name}
                            {item.quantity > 1 ? <span className="text-muted"> × {item.quantity}</span> : ""}
                          </span>
                          <span className="shrink-0 text-right tabular-nums text-muted">
                            {item.price * item.quantity} {receipt.currency}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-separator pt-2 text-right text-sm font-semibold tabular-nums text-foreground">
                      {receipt.totalAmount} {receipt.currency}
                    </p>
                  </div>
                ))}
                <p className="text-right text-foreground">
                  Разом:{" "}
                  <strong className="tabular-nums text-accent">
                    {status.receipts.reduce((sum, r) => sum + r.totalAmount, 0)} {status.receipts[0].currency}
                  </strong>
                </p>
              </div>
            )}
          </div>
        )}

        {(!status || CAN_REQUEST.has(status.status)) && (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <TextField value={tableCode} onChange={setTableCode} isRequired>
              <Label>Код столу (з QR-наклейки)</Label>
              <Input />
            </TextField>
            <Button
              type="submit"
              variant="primary"
              isPending={isSubmitting}
              className="min-h-11 active:scale-[0.98]"
            >
              {isSubmitting && <Spinner size="sm" color="current" />}
              Запросити прив&apos;язку
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
