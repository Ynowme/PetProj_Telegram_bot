"use client";

import { useEffect, useState } from "react";
import { AlertDialog, Button, Card, Skeleton, toast } from "@heroui/react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

// Спільна модель для двох однакових черг підтвердження (привʼязка до столу і послуги):
// API-роути мають ідентичну схему `${endpoint}/${id}/${confirm|reject}`, різниться лише
// склад полів для заголовка картки, тож він приходить ззовні через titleFor.
export type PendingRequestItem = {
  id: string;
  requestedAt: string;
  comment?: string | null;
  guest: { id: string; name: string; telegramUsername: string | null; phone: string | null };
};

function guestLine(guest: PendingRequestItem["guest"]): string {
  const parts = [guest.name];
  if (guest.telegramUsername) parts.push(`@${guest.telegramUsername}`);
  if (guest.phone) parts.push(guest.phone);
  return parts.join(" · ");
}

export function PendingRequestsPanel<T extends PendingRequestItem>({
  endpoint,
  titleFor,
  emptyTitle,
  confirmToast,
  rejectToast,
}: {
  endpoint: string;
  titleFor: (item: T) => string;
  emptyTitle: string;
  confirmToast: string;
  rejectToast: string;
}) {
  const [items, setItems] = useState<T[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch(endpoint)
      .then((response) => (response.ok ? (response.json() as Promise<T[]>) : null))
      .then((data) => {
        if (data) setItems(data);
      });
  }, [endpoint, reloadKey]);

  const act = async (id: string, action: "confirm" | "reject") => {
    setBusyId(id);
    const response = await fetch(`${endpoint}/${id}/${action}`, { method: "POST" });
    setBusyId(null);
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося виконати дію");
      return;
    }
    toast.success(action === "confirm" ? confirmToast : rejectToast);
    setReloadKey((key) => key + 1);
  };

  if (items === null) {
    // Skeleton повторює форму майбутніх карток, щоб контент не "стрибав" після завантаження
    return (
      <div className="grid gap-3">
        {[0, 1].map((index) => (
          <Card key={index}>
            <Card.Content className="grid gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64" />
            </Card.Content>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <AdminEmptyState title={emptyTitle} description="Нові запити зʼявляться тут автоматично." />;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Card key={item.id}>
          <Card.Content className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid gap-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <strong className="text-foreground">{titleFor(item)}</strong>
                <span className="text-xs text-muted">{new Date(item.requestedAt).toLocaleString("uk-UA")}</span>
              </div>
              <p className="text-sm text-muted">{guestLine(item.guest)}</p>
              {item.comment && <p className="text-sm text-foreground">{item.comment}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                isPending={busyId === item.id}
                onPress={() => act(item.id, "confirm")}
              >
                Підтвердити
              </Button>
              {/* Відхилення — деструктивна дія: спершу AlertDialog з деталями запиту */}
              <AlertDialog>
                <Button type="button" variant="danger" size="sm" isDisabled={busyId === item.id}>
                  Відхилити
                </Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog>
                      {({ close }) => (
                        <>
                          <AlertDialog.Header>
                            <AlertDialog.Icon status="danger" />
                            <AlertDialog.Heading>Відхилити запит?</AlertDialog.Heading>
                          </AlertDialog.Header>
                          <AlertDialog.Body>
                            <p className="text-sm text-muted">
                              {titleFor(item)} · {guestLine(item.guest)}. Гість побачить, що запит відхилено.
                            </p>
                          </AlertDialog.Body>
                          <AlertDialog.Footer>
                            <Button type="button" variant="outline" onPress={close}>
                              Скасувати
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onPress={() => {
                                close();
                                void act(item.id, "reject");
                              }}
                            >
                              Відхилити
                            </Button>
                          </AlertDialog.Footer>
                        </>
                      )}
                    </AlertDialog.Dialog>
                  </AlertDialog.Container>
                </AlertDialog.Backdrop>
              </AlertDialog>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
