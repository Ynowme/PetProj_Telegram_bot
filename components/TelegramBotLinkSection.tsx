"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, Chip, buttonVariants, cn, toast } from "@heroui/react";

type BotStatus = { linked: boolean; hasPhone: boolean };

// Кроки привʼязки бота: номер телефону в профілі -> одноразове посилання -> підтвердження
// в Telegram. Номер кроку підсвічується залежно від того, де зараз зупинився гість.
function StepBadge({ index, state }: { index: number; state: "done" | "active" | "pending" }) {
  return (
    <span
      aria-hidden
      className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
        state === "done"
          ? "bg-success-soft text-success"
          : state === "active"
            ? "bg-accent text-accent-foreground"
            : "bg-surface-secondary text-muted"
      }`}
    >
      {state === "done" ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        index
      )}
    </span>
  );
}

export function TelegramBotLinkSection() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/account/telegram-bot")
      .then((response) => (response.ok ? (response.json() as Promise<BotStatus>) : null))
      .then((data) => {
        if (data) setStatus(data);
      });
  }, [reloadKey]);

  const requestLink = async () => {
    setDeepLink(null);
    const response = await fetch("/api/account/telegram-bot/link-token", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      toast.danger(data?.error?.message ?? "Не вдалося отримати посилання");
      return;
    }
    const data = (await response.json()) as { deepLink: string | null };
    if (!data.deepLink) {
      toast.danger("Бот ще не налаштований адміністратором (немає NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)");
      return;
    }
    setDeepLink(data.deepLink);
  };

  const unlink = async () => {
    const response = await fetch("/api/account/telegram-bot", { method: "DELETE" });
    if (!response.ok) {
      toast.danger("Не вдалося відв'язати бота");
      return;
    }
    toast.success("Бота відв'язано");
    setDeepLink(null);
    setReloadKey((key) => key + 1);
  };

  if (!status) return null;

  return (
    <Card className="mt-6">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-medium text-foreground">Telegram-бот</h2>
          {status.linked && (
            <Chip color="success" variant="soft" size="sm">
              Привʼязано
            </Chip>
          )}
        </div>

        {status.linked ? (
          <>
            <p className="mt-2 text-sm text-muted">
              Бот надсилатиме сповіщення про бонуси та статуси ваших запитів.
            </p>
            <Button
              type="button"
              variant="danger-soft"
              onPress={() => void unlink()}
              className="mt-4 min-h-11 active:scale-[0.98]"
            >
              Відвʼязати бота
            </Button>
          </>
        ) : (
          <ol className="mt-4 grid gap-4">
            <li className="flex items-start gap-3">
              <StepBadge index={1} state={status.hasPhone ? "done" : "active"} />
              <div className="grid gap-1 text-sm">
                <span className="font-medium text-foreground">Номер телефону в профілі</span>
                {!status.hasPhone && (
                  <span className="text-muted">
                    Спочатку вкажіть номер телефону в профілі, щоб отримати доступ до бота.
                  </span>
                )}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <StepBadge index={2} state={!status.hasPhone ? "pending" : deepLink ? "done" : "active"} />
              <div className="grid gap-2 text-sm">
                <span className="font-medium text-foreground">Одноразове посилання</span>
                {status.hasPhone && !deepLink && (
                  <>
                    <span className="text-muted">
                      Отримайте одноразове посилання, щоб підтвердити номер і привʼязати бота.
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => void requestLink()}
                      className="min-h-11 justify-self-start active:scale-[0.98]"
                    >
                      Отримати посилання
                    </Button>
                  </>
                )}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <StepBadge index={3} state={deepLink ? "active" : "pending"} />
              <div className="grid gap-2 text-sm">
                <span className="font-medium text-foreground">Підтвердження в Telegram</span>
                {deepLink && (
                  <>
                    <span className="text-muted">
                      Відкрийте бота й натисніть Start, привʼязка завершиться автоматично.
                    </span>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "primary" }),
                        "min-h-11 justify-self-start active:scale-[0.98]",
                      )}
                    >
                      Відкрити бота в Telegram
                    </a>
                  </>
                )}
              </div>
            </li>
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
