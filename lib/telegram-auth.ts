import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Дані, які Telegram Login Widget передає у клієнтський callback.
// https://core.telegram.org/widgets/login
export type TelegramAuthPayload = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
};

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export function isTelegramAuthPayload(value: unknown): value is TelegramAuthPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (typeof v.id === "number" || typeof v.id === "string") &&
    (typeof v.auth_date === "number" || typeof v.auth_date === "string") &&
    typeof v.hash === "string" &&
    v.hash.length > 0
  );
}

/**
 * Перевіряє HMAC-підпис даних від Telegram Login Widget (захист від підробки)
 * та вік підпису (захист від replay зі старим payload).
 */
export function verifyTelegramAuth(payload: TelegramAuthPayload, botToken: string | undefined): boolean {
  if (!botToken) return false;

  const { hash, ...rest } = payload;
  const checkString = Object.keys(rest)
    .filter((key) => rest[key as keyof typeof rest] !== undefined)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  const computedBuffer = Buffer.from(computedHash, "hex");
  const providedBuffer = Buffer.from(hash, "hex");
  if (computedBuffer.length !== providedBuffer.length) return false;
  if (!timingSafeEqual(computedBuffer, providedBuffer)) return false;

  const authDateSeconds = Number(payload.auth_date);
  if (!Number.isFinite(authDateSeconds)) return false;
  const ageSeconds = Date.now() / 1000 - authDateSeconds;
  return ageSeconds >= 0 && ageSeconds <= MAX_AUTH_AGE_SECONDS;
}
