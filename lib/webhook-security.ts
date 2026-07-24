import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

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
 * Общий каркас HMAC-подписанных webhook'ов (`x-webhook-signature`): читает сырое тело,
 * проверяет подпись до разбора JSON (FR-015), затем валидирует форму payload'а. Возвращает
 * либо типизированный payload, либо готовый ответ об ошибке — вызывающему остаётся только
 * передать секрет и type guard и обработать бизнес-логику.
 */
export async function readVerifiedWebhookBody<T>(
  request: NextRequest,
  options: { secret: string | undefined; isValid: (value: unknown) => value is T },
): Promise<{ payload: T; response: null } | { payload: null; response: NextResponse }> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  if (!verifyWebhookSignature(rawBody, signature, options.secret)) {
    return { payload: null, response: NextResponse.json({ error: { code: "INVALID_SIGNATURE" } }, { status: 401 }) };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { payload: null, response: NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 }) };
  }

  if (!options.isValid(parsed)) {
    return { payload: null, response: NextResponse.json({ error: { code: "INVALID_BODY" } }, { status: 400 }) };
  }

  return { payload: parsed, response: null };
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
