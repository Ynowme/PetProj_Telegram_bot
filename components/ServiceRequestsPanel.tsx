"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Label,
  Skeleton,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";

type RequestType = "TABLE_BOOKING" | "HOOKAH_RENTAL";
type RequestStatus = "PENDING" | "CONFIRMED" | "REJECTED";
type Table = { tableCode: string; open: boolean };

type ServiceRequestItem = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  tableCode: string | null;
  comment: string | null;
  requestedAt: string;
};

const TYPE_LABEL: Record<RequestType, string> = {
  TABLE_BOOKING: "Бронювання столу",
  HOOKAH_RENTAL: "Оренда кальяну",
};

// Статуси заявок мапляться на семантичні кольори Chip: очікування — warning,
// підтверджено — success, відмова — danger.
const STATUS_CHIP: Record<RequestStatus, { label: string; color: "warning" | "success" | "danger" }> = {
  PENDING: { label: "Очікує підтвердження", color: "warning" },
  CONFIRMED: { label: "Підтверджено", color: "success" },
  REJECTED: { label: "Відхилено", color: "danger" },
};

function TableBookingForm({ onSent }: { onSent: () => void }) {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/account/tables")
      .then((response) => (response.ok ? (response.json() as Promise<Table[]>) : null))
      .then((data) => {
        if (data) setTables(data);
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      toast.danger("Оберіть стіл");
      return;
    }
    setIsSubmitting(true);

    const response = await fetch("/api/account/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TABLE_BOOKING", tableCode: selected, comment }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setComment("");
    setSelected(null);
    toast.success("Запит надіслано, персонал звʼяжеться з вами");
    onSent();
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-medium text-foreground">Забронювати стіл</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          {tables === null && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-11 w-11 rounded-lg" />
              ))}
            </div>
          )}
          {tables && tables.length === 0 && <p className="text-sm text-muted">Наразі столи не налаштовані.</p>}
          {tables && tables.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Вибір столу">
              {tables.map((table) => (
                <Button
                  key={table.tableCode}
                  type="button"
                  size="md"
                  variant={selected === table.tableCode ? "primary" : "outline"}
                  isDisabled={table.open}
                  onPress={() => setSelected(table.tableCode)}
                  aria-label={`Стіл ${table.tableCode}${table.open ? ", зайнятий" : ", вільний"}`}
                  className="min-h-11 min-w-11 tabular-nums active:scale-[0.96]"
                >
                  {table.tableCode}
                </Button>
              ))}
            </div>
          )}
          <TextField value={comment} onChange={setComment}>
            <Label>Побажання (час, кількість гостей тощо), необовʼязково</Label>
            <TextArea rows={2} />
          </TextField>
          <Button
            type="submit"
            variant="primary"
            isPending={isSubmitting}
            isDisabled={!selected}
            className="min-h-11 active:scale-[0.98]"
          >
            {isSubmitting && <Spinner size="sm" color="current" />}
            {selected ? `Забронювати стіл ${selected}` : "Оберіть стіл вище"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HookahRentalForm({ onSent }: { onSent: () => void }) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const response = await fetch("/api/account/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "HOOKAH_RENTAL", comment }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося надіслати запит");
      return;
    }

    setComment("");
    toast.success("Запит надіслано, персонал звʼяжеться з вами");
    onSent();
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-medium text-foreground">Замовити оренду кальяну</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <TextField value={comment} onChange={setComment}>
            <Label>Ваші побажання (смак, час тощо), необовʼязково</Label>
            <TextArea rows={3} />
          </TextField>
          <Button
            type="submit"
            variant="primary"
            isPending={isSubmitting}
            className="min-h-11 active:scale-[0.98]"
          >
            {isSubmitting && <Spinner size="sm" color="current" />}
            Відправити запит
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ServiceRequestsPanel() {
  const [history, setHistory] = useState<ServiceRequestItem[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/account/service-requests")
      .then((response) => (response.ok ? (response.json() as Promise<ServiceRequestItem[]>) : null))
      .then((data) => {
        if (data) setHistory(data);
      });
  }, [reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <div className="grid gap-4">
      {history && history.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-medium text-foreground">Ваші запити</h2>
            <ul className="mt-3 grid gap-2.5">
              {history.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 text-sm text-foreground">
                    {TYPE_LABEL[item.type]}
                    {item.tableCode ? <span className="tabular-nums"> №{item.tableCode}</span> : ""}
                    {item.comment ? <span className="text-muted"> · {item.comment}</span> : ""}
                  </span>
                  <Chip color={STATUS_CHIP[item.status].color} variant="soft" size="sm">
                    {STATUS_CHIP[item.status].label}
                  </Chip>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <TableBookingForm onSent={reload} />
      <HookahRentalForm onSent={reload} />
    </div>
  );
}
