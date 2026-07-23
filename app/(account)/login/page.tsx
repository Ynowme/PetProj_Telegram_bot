import { TelegramLoginButton } from "@/components/TelegramLoginButton";

export default function LoginPage() {
  return (
    <main className="page page--narrow">
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Вхід</h1>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Вхід та реєстрація в особистий кабінет виконуються через Telegram.
        </p>

        <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          <TelegramLoginButton />
        </div>
      </div>
    </main>
  );
}
