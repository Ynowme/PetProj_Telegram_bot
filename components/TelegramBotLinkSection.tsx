"use client";

import { useEffect, useState } from "react";

type BotStatus = { linked: boolean; hasPhone: boolean };

export function TelegramBotLinkSection() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/account/telegram-bot")
      .then((response) => (response.ok ? (response.json() as Promise<BotStatus>) : null))
      .then((data) => {
        if (data) setStatus(data);
      });
  }, [reloadKey]);

  const requestLink = async () => {
    setError(null);
    setDeepLink(null);
    const response = await fetch("/api/account/telegram-bot/link-token", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(data?.error?.message ?? "Не вдалося отримати посилання");
      return;
    }
    const data = (await response.json()) as { deepLink: string | null };
    setDeepLink(
      data.deepLink ?? "Бот ще не налаштований адміністратором (немає NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)",
    );
  };

  const unlink = async () => {
    setError(null);
    const response = await fetch("/api/account/telegram-bot", { method: "DELETE" });
    if (!response.ok) {
      setError("Не вдалося відв'язати бота");
      return;
    }
    setReloadKey((key) => key + 1);
  };

  if (!status) return null;

  return (
    <div className="panel" style={{ marginTop: "1.5rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Telegram-бот</h2>

      {status.linked ? (
        <>
          <p className="text-success" style={{ margin: 0 }}>
            Бот привʼязано
          </p>
          <button type="button" onClick={unlink} style={{ marginTop: "0.75rem" }}>
            Відвʼязати бота
          </button>
        </>
      ) : !status.hasPhone ? (
        <p className="text-muted" style={{ margin: 0 }}>
          Спочатку вкажіть номер телефону в профілі, щоб отримати доступ до бота.
        </p>
      ) : (
        <>
          <p className="text-muted" style={{ margin: 0 }}>
            Отримайте одноразове посилання, щоб підтвердити номер і привʼязати бота.
          </p>
          <button type="button" onClick={requestLink} style={{ marginTop: "0.75rem" }}>
            Отримати посилання
          </button>
          {deepLink && <p className="text-muted" style={{ wordBreak: "break-all" }}>{deepLink}</p>}
        </>
      )}

      {error && <p className="text-error">{error}</p>}
    </div>
  );
}
