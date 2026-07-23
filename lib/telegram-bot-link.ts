import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/request-security";
import { writeAuditLog } from "@/lib/audit-log";

const TOKEN_TTL_MS = 10 * 60_000;

export class TelegramBotLinkError extends Error {
  constructor(public code: "NOT_GOLD_MEMBER" | "PHONE_NOT_SET" | "NOT_LINKED") {
    super(code);
  }
}

export class TelegramBotConfirmError extends Error {
  constructor(public code: "TOKEN_EXPIRED_OR_USED" | "LINK_FAILED") {
    super(code);
  }
}

/**
 * Выдаёт одноразовый токен deep link боту (FR-010, FR-011). Только для Gold Member
 * с указанным номером телефона — сам номер подтверждается процессом привязки (FR-012),
 * отдельного предварительного шага верификации нет. Сырой токен возвращается один раз
 * и никогда не хранится — в БД пишется только его SHA-256 хеш.
 */
export async function issueTelegramBotLinkToken(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "GOLD_MEMBER") throw new TelegramBotLinkError("NOT_GOLD_MEMBER");
  if (!user.phone) throw new TelegramBotLinkError("PHONE_NOT_SET");

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.telegramBotLinkToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { rawToken, expiresAt };
}

async function confirmTelegramBotContactByToken(
  token: { id: string; userId: string; usedAt: Date | null; expiresAt: Date },
  params: { telegramUserId: string; phone: string },
): Promise<{ userId: string }> {
  if (token.usedAt || token.expiresAt.getTime() < Date.now()) {
    throw new TelegramBotConfirmError("TOKEN_EXPIRED_OR_USED");
  }

  const user = await prisma.user.findUnique({ where: { id: token.userId } });
  const normalizedPhone = normalizePhone(params.phone);

  const phoneMatches = user && normalizedPhone && user.phone === normalizedPhone;
  const telegramIdMatches = user && (!user.telegramId || user.telegramId === params.telegramUserId);

  if (!user || !phoneMatches || !telegramIdMatches) {
    throw new TelegramBotConfirmError("LINK_FAILED");
  }

  await prisma.telegramBotLinkToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerifiedAt: user.phoneVerifiedAt ?? new Date(),
      telegramBotLinkedAt: new Date(),
    },
  });

  if (!user.phoneVerifiedAt) {
    await writeAuditLog({ action: "PHONE_VERIFIED", targetUserId: user.id, actor: "SYSTEM" });
  }
  await writeAuditLog({ action: "BOT_LINKED", targetUserId: user.id, actor: "SYSTEM" });

  return { userId: user.id };
}

/**
 * Подтверждает привязку бота по контакту, полученному через Telegram `request_contact`
 * (FR-012). Сверяет номер и (если у аккаунта уже есть telegramId из входа через Login
 * Widget) Telegram user id — оба должны совпасть с тем же гостем, иначе привязка
 * отклоняется общей ошибкой без уточнения причины (анти-энумерация). Первое успешное
 * подтверждение помечает телефон как подтверждённый.
 *
 * Используется внутренним webhook-контрактом `/api/webhooks/telegram-bot/confirm-contact`
 * (fake-транспорт и внешние contract-тесты). Реальный бот-адаптер использует
 * `confirmTelegramBotContactByChat`, т.к. к моменту получения контакта у него уже
 * нет сырого токена — только `chat_id`, привязанный на шаге `/start`.
 */
export async function confirmTelegramBotContact(params: {
  rawToken: string;
  telegramUserId: string;
  phone: string;
}): Promise<{ userId: string }> {
  const tokenHash = createHash("sha256").update(params.rawToken).digest("hex");
  const token = await prisma.telegramBotLinkToken.findUnique({ where: { tokenHash } });

  if (!token) throw new TelegramBotConfirmError("TOKEN_EXPIRED_OR_USED");

  return confirmTelegramBotContactByToken(token, params);
}

/**
 * Привязывает `chat_id` реального Telegram-чата к токену на шаге `/start <rawToken>`
 * (до нажатия кнопки `request_contact`). Нужен как мост между двумя отдельными
 * апдейтами бота: `/start` содержит сырой токен, а последующее сообщение с контактом —
 * только `chat_id` и `from.id`. Не продлевает и не проверяет что-либо сверх обычной
 * валидности токена; сама привязка контакта проверяется позже в `confirmTelegramBotContactByChat`.
 */
export async function bindTelegramBotLinkChat(rawToken: string, telegramChatId: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const token = await prisma.telegramBotLinkToken.findUnique({ where: { tokenHash } });

  if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) return false;

  await prisma.telegramBotLinkToken.update({ where: { id: token.id }, data: { telegramChatId } });
  return true;
}

/**
 * Подтверждает привязку по `chat_id`, ранее сохранённому в `bindTelegramBotLinkChat`.
 * Используется реальным webhook-обработчиком апдейтов Telegram (`.../telegram-bot/update`)
 * при получении сообщения с `message.contact`. Берёт последний непросроченный
 * неиспользованный токен для этого чата — по одному активному запросу привязки на чат.
 */
export async function confirmTelegramBotContactByChat(
  telegramChatId: string,
  params: { telegramUserId: string; phone: string },
): Promise<{ userId: string }> {
  const token = await prisma.telegramBotLinkToken.findFirst({
    where: { telegramChatId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!token) throw new TelegramBotConfirmError("TOKEN_EXPIRED_OR_USED");

  return confirmTelegramBotContactByToken(token, params);
}

/** FR-027: гость может отвязать бота в любой момент. */
export async function unlinkTelegramBot(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.telegramBotLinkedAt) throw new TelegramBotLinkError("NOT_LINKED");

  await prisma.user.update({ where: { id: userId }, data: { telegramBotLinkedAt: null } });
  await writeAuditLog({ action: "BOT_UNLINKED", targetUserId: userId, actor: userId });
}
