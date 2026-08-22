import Link from "next/link";
import { Card, CardContent } from "@heroui/react";
import { TelegramBotLoginButton } from "@/components/TelegramBotLoginButton";
import { getSiteContent } from "@/lib/site-content";

const BENEFITS = [
  "Замовляйте зі столу прямо з телефону, офіціант лише підтверджує",
  "Бонуси та привілеї Gold Member",
  "Історія замовлень і чеків завжди під рукою",
];

// Структура екрана — за референсом (easy.choiceqr.com/auth): смуга "назад" + заголовок,
// лого закладу, назва, кнопка входу, короткий список переваг. Сам метод входу —
// лише Telegram (FR-004), тож немає сенсу відтворювати Google/Apple/email-варіанти референсу.
export default async function LoginPage() {
  const siteContent = await getSiteContent();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/"
          aria-label="Назад"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground active:scale-[0.96]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-muted">Авторизація</span>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="grid justify-items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- лого з CastaPOS-адмінки або статичний фолбек-бейдж */}
            <img
              src={siteContent?.logoUrl ?? "/logo.svg"}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl object-contain"
            />
            <h1 className="text-2xl font-semibold text-foreground">
              Увійти в {siteContent?.venueName ?? "заклад"}
            </h1>
          </div>

          <TelegramBotLoginButton />

          <ul className="grid gap-2.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-muted">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-success"
                  aria-hidden="true"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
