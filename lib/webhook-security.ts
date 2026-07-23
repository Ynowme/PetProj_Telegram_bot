import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Проверяет HMAC-SHA256 подпись webhook по сырому телу запроса до его разбора
 * (specs/002-member-gold-system, FR-015). Подпись сравнивается timing-safe.
 */
export function verifyWebhookSignature(rawBody: string, signatureHex: string | null, secret: string | undefined): boolean {
  if (!secret || !signatureHex) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signatureHex, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Сравнивает секрет-токен (например, заголовок `X-Telegram-Bot-Api-Secret-Token`,
 * который Telegram лишь эхом возвращает — сам он ничего не подписывает) timing-safe.
 * В отличие от `verifyWebhookSignature`, здесь нет HMAC — только сравнение с секретом,
 * заданным при регистрации webhook (`setWebhook`).
 */
export function verifySecretToken(provided: string | null, secret: string | undefined): boolean {
  if (!secret || !provided) return false;

  const expectedBuffer = Buffer.from(secret, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
