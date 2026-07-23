"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

// Telegram Login Widget: https://core.telegram.org/widgets/login
// Не працює на localhost — потрібен публічний домен з HTTPS (або ngrok на час тесту),
// заданий у @BotFather командою /setdomain.
export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = (user) => {
      void signIn("telegram", { payload: JSON.stringify(user), callbackUrl: "/account" });
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    const container = containerRef.current;
    container.appendChild(script);

    return () => {
      container.removeChild(script);
      delete window.onTelegramAuth;
    };
  }, [botUsername]);

  if (!botUsername) {
    return (
      <p className="text-muted" style={{ fontSize: "0.85rem" }}>
        Вхід через Telegram ще не налаштований (немає NEXT_PUBLIC_TELEGRAM_BOT_USERNAME).
      </p>
    );
  }

  return <div ref={containerRef} />;
}
