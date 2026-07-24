import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 10 * 60_000;
const TOKEN_PREFIX = "lg_";

export class TelegramLoginError extends Error {
  constructor(public code: "TOKEN_EXPIRED_OR_USED") {
    super(code);
  }
}

export function isTelegramLoginStartToken(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX);
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Выдаёт одноразовый токен deep link для входа (замена Login Widget, FR-004). Сырой
 * токен возвращается один раз и никогда не хранится — в БД пишется только его SHA-256 хеш.
 */
export async function issueTelegramLoginToken(): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = TOKEN_PREFIX + randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.telegramLoginToken.create({ data: { tokenHash: hashToken(rawToken), expiresAt } });

  return { rawToken, expiresAt };
}

/**
 * Подтверждает вход по апдейту `/start <token>` от реального Telegram-бота. В отличие
 * от привязки бота Gold Member, апдейт `/start` уже содержит telegram id и имя — отдельный
 * шаг с request_contact не нужен, вход завершается сразу.
 */
export async function confirmTelegramLoginStart(
  rawToken: string,
  params: { telegramUserId: string; username?: string; firstName?: string; lastName?: string },
): Promise<boolean> {
  const token = await prisma.telegramLoginToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!token || token.consumedAt || token.expiresAt.getTime() < Date.now()) return false;

  await prisma.telegramLoginToken.update({
    where: { id: token.id },
    data: {
      telegramUserId: params.telegramUserId,
      telegramUsername: params.username ?? null,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      confirmedAt: new Date(),
    },
  });
  return true;
}

export type TelegramLoginStatus = "PENDING" | "CONFIRMED" | "EXPIRED";

/** Опрашивается фронтом, пока гість не підтвердить вхід у Telegram. */
export async function getTelegramLoginStatus(rawToken: string): Promise<TelegramLoginStatus> {
  const token = await prisma.telegramLoginToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!token || token.consumedAt || token.expiresAt.getTime() < Date.now()) return "EXPIRED";
  return token.confirmedAt ? "CONFIRMED" : "PENDING";
}

/**
 * Разово потребляет подтверждённый токен для завершения входу в NextAuth `authorize()`
 * (lib/auth.ts, provider "telegram-bot"). Атомарна за рахунок `updateMany` з умовою
 * `consumedAt: null` — паралельний повторний виклик з тим самим токеном не пройде двічі.
 */
export async function consumeTelegramLoginToken(rawToken: string): Promise<{
  telegramId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
}> {
  const token = await prisma.telegramLoginToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });

  if (
    !token ||
    token.consumedAt ||
    token.expiresAt.getTime() < Date.now() ||
    !token.confirmedAt ||
    !token.telegramUserId
  ) {
    throw new TelegramLoginError("TOKEN_EXPIRED_OR_USED");
  }

  const { count } = await prisma.telegramLoginToken.updateMany({
    where: { id: token.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (count === 0) throw new TelegramLoginError("TOKEN_EXPIRED_OR_USED");

  return {
    telegramId: token.telegramUserId,
    telegramUsername: token.telegramUsername,
    firstName: token.firstName,
    lastName: token.lastName,
  };
}
