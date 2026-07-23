// Разовый ручной скрипт: регистрирует webhook апдейтов Telegram Bot API
// (https://core.telegram.org/bots/api#setwebhook) на публичном HTTPS-домене сайта.
// Запуск: npm run telegram:set-webhook
//
// Требует переменные окружения (см. .env.example):
//   TELEGRAM_BOT_TOKEN         — токен бота от @BotFather
//   TELEGRAM_BOT_UPDATE_SECRET — секрет, который Telegram будет присылать в заголовке
//                                 X-Telegram-Bot-Api-Secret-Token с каждым апдейтом
//   NEXTAUTH_URL                — публичный HTTPS-адрес сайта (не localhost)

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = process.env.TELEGRAM_BOT_UPDATE_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN не заданий");
  if (!secretToken) throw new Error("TELEGRAM_BOT_UPDATE_SECRET не заданий");
  if (!baseUrl || baseUrl.includes("localhost")) {
    throw new Error("NEXTAUTH_URL має бути публічним HTTPS-доменом (не localhost) — Telegram не приймає локальні webhook");
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/telegram-bot/update`;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ["message"],
    }),
  });

  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));

  if (!response.ok || !result.ok) {
    throw new Error("setWebhook відхилено Telegram — див. відповідь вище");
  }

  console.log(`\nWebhook зареєстровано: ${webhookUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
