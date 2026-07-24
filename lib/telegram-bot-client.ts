// Минимальная обёртка над Telegram Bot API (без нового npm-пакета).
// https://core.telegram.org/bots/api#sendmessage
// Токен только серверный (TELEGRAM_BOT_TOKEN), никогда не логируется и не попадает в клиент.

type InlineLinkButton = { text: string; url: string };

type SendMessageParams = {
  chatId: string | number;
  text: string;
  requestContactButtonText?: string;
  inlineButtons?: InlineLinkButton[];
};

export async function sendTelegramMessage(params: SendMessageParams): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const reply_markup = params.requestContactButtonText
    ? {
        keyboard: [[{ text: params.requestContactButtonText, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    : params.inlineButtons?.length
      ? { inline_keyboard: params.inlineButtons.map((button) => [{ text: button.text, url: button.url }]) }
      : { remove_keyboard: true };

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      reply_markup,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with status ${response.status}`);
  }
}
