import Link from "next/link";
import { TelegramBotLoginButton } from "@/components/TelegramBotLoginButton";
import { getSiteContent } from "@/lib/site-content";

const BENEFITS = [
  "Замовляйте зі столу прямо з телефону — офіціант лише підтверджує",
  "Бонуси та привілеї Gold Member",
  "Історія замовлень і чеків завжди під рукою",
];

// Структура екрана — за референсом (easy.choiceqr.com/auth): повноширинна смуга "назад" +
// заголовок, лого закладу, назва, кнопка входу, короткий список переваг. Сам метод входу —
// лише Telegram (FR-004), тож немає сенсу відтворювати Google/Apple/email-варіанти референсу.
export default async function LoginPage() {
  const siteContent = await getSiteContent();

  return (
    <main className="page page--narrow">
      <div className="auth-topbar">
        <Link href="/" className="auth-topbar__back" aria-label="Назад">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="auth-topbar__title">Авторизація</span>
      </div>

      <div className="panel">
        <div className="auth-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- лого з CastaPOS-адмінки або статичний фолбек-бейдж */}
          <img src={siteContent?.logoUrl ?? "/logo.svg"} alt="" width={56} height={56} />
          <h1>Увійти в {siteContent?.venueName ?? "заклад"}</h1>
        </div>

        <TelegramBotLoginButton />

        <ul className="auth-benefits">
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
