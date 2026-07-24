"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { signIn } from "next-auth/react";

type StartResponse = { token: string; deepLink: string | null; expiresAt: string };
type StatusResponse = { status: "PENDING" | "CONFIRMED" | "EXPIRED" };

const POLL_INTERVAL_MS = 2000;
const HINT_DELAY_MS = 15000;

const buttonLinkStyle: CSSProperties = {
  display: "inline-block",
  color: "var(--foreground)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "0.6rem 1rem",
  font: "inherit",
  textDecoration: "none",
  textAlign: "center",
};

// Вхід через реального Telegram-бота (deep link, FR-004): на відміну від Login Widget,
// t.me/<bot>?start=<token> завжди відкриває саме застосунок Telegram, а не веб-версію.
export function TelegramBotLoginButton() {
  const [deepLink, setDeepLink] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "waiting" | "confirmed" | "expired">("idle");
  const [showHint, setShowHint] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
  };

  const loadToken = () => {
    fetch("/api/auth/telegram-bot/start", { method: "POST" })
      .then((response) => (response.ok ? (response.json() as Promise<StartResponse>) : null))
      .then((data) => {
        if (!data) {
          setDeepLink(null);
          return;
        }
        tokenRef.current = data.token;
        setToken(data.token);
        setDeepLink(data.deepLink);
      })
      .catch(() => setDeepLink(null));
  };

  const retry = () => {
    stopPolling();
    setStatus("idle");
    setShowHint(false);
    setDeepLink(undefined);
    loadToken();
  };

  useEffect(() => {
    loadToken();
    return stopPolling;
  }, []);

  const handleOpen = () => {
    const token = tokenRef.current;
    if (!token) return;
    setStatus("waiting");
    setShowHint(false);
    hintTimerRef.current = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    pollRef.current = setInterval(async () => {
      const response = await fetch(`/api/auth/telegram-bot/status?token=${encodeURIComponent(token)}`);
      if (!response.ok) return;
      const data = (await response.json()) as StatusResponse;
      if (data.status === "CONFIRMED") {
        stopPolling();
        setStatus("confirmed");
        void signIn("telegram-bot", { token, callbackUrl: "/account" });
      } else if (data.status === "EXPIRED") {
        stopPolling();
        setStatus("expired");
      }
    }, POLL_INTERVAL_MS);
  };

  if (deepLink === null) {
    return (
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        Вхід через Telegram ще не налаштований (немає NEXT_PUBLIC_TELEGRAM_BOT_USERNAME).
      </p>
    );
  }

  if (status === "expired") {
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <p className="text-error" style={{ margin: 0 }}>
          Час очікування вийшов.
        </p>
        <button type="button" onClick={retry}>
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <a
        href={deepLink ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={deepLink ? handleOpen : (event) => event.preventDefault()}
        style={{ ...buttonLinkStyle, opacity: deepLink ? 1 : 0.6, pointerEvents: deepLink ? "auto" : "none" }}
      >
        Увійти через Telegram
      </a>
      {status === "waiting" && (
        <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Підтвердіть вхід у застосунку Telegram, що відкрився…
        </p>
      )}
      {status === "waiting" && showHint && (
        <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Нічого не відбувається? Якщо посилання відкрилося в браузері замість застосунку
          Telegram — відкрийте чат з ботом вручну і надішліть команду{" "}
          <code style={{ userSelect: "all" }}>/start {token}</code>.
        </p>
      )}
      {status === "confirmed" && (
        <p className="text-success" style={{ margin: 0, fontSize: "0.85rem" }}>
          Вхід підтверджено, завершуємо…
        </p>
      )}
    </div>
  );
}
