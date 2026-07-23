import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { fakePosOpenTable, fakePosReset } from "@/lib/pos/fake-provider";
import { importPosReceipt, refundPosReceipt } from "@/lib/receipt-import";
import { GOLD_THRESHOLD } from "@/lib/roles";
import {
  issueTelegramBotLinkToken,
  confirmTelegramBotContact,
  bindTelegramBotLinkChat,
  confirmTelegramBotContactByChat,
  unlinkTelegramBot,
  TelegramBotLinkError,
} from "@/lib/telegram-bot-link";

const RUN_ID = Date.now();
const userIds: string[] = [];
let guestCounter = 0;

async function createGuest(label: string) {
  guestCounter += 1;
  const user = await prisma.user.create({
    data: {
      name: `Vitest ${label}`,
      telegramId: `vitest-${RUN_ID}-${label}`,
      phone: `+380${String(RUN_ID).slice(-6)}${String(guestCounter).padStart(3, "0")}`,
    },
  });
  userIds.push(user.id);
  return user;
}

async function confirmedTableSession(userId: string, tableCode: string) {
  fakePosOpenTable(tableCode);
  return prisma.tableSession.create({
    data: { tableCode, userId, status: "CONFIRMED", confirmedAt: new Date() },
  });
}

afterAll(async () => {
  await prisma.auditLogEntry.deleteMany({ where: { targetUserId: { in: userIds } } });
  await prisma.telegramBotLinkToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.bonusTransaction.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.receipt.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.tableSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

beforeEach(() => {
  fakePosReset();
});

describe("TableSession: один активный гость на стол (FR-017)", () => {
  it("отклоняет вторую активную привязку к тому же tableCode на уровне БД", async () => {
    const guestA = await createGuest("table-a");
    const guestB = await createGuest("table-b");
    const tableCode = `T-${RUN_ID}`;

    await confirmedTableSession(guestA.id, tableCode);

    await expect(
      prisma.tableSession.create({ data: { tableCode, userId: guestB.id } }),
    ).rejects.toThrow();
  });

  it("разрешает новую привязку к tableCode после того, как предыдущая закрыта", async () => {
    const guestA = await createGuest("table-closed-a");
    const guestB = await createGuest("table-closed-b");
    const tableCode = `T-closed-${RUN_ID}`;

    const first = await confirmedTableSession(guestA.id, tableCode);
    await prisma.tableSession.update({ where: { id: first.id }, data: { status: "CLOSED", closedAt: new Date() } });

    const second = await prisma.tableSession.create({ data: { tableCode, userId: guestB.id } });
    expect(second.userId).toBe(guestB.id);
  });
});

describe("importPosReceipt: идемпотентность (FR-015, SC-006)", () => {
  it("повторная доставка того же posExternalId не создаёт дубликат чека", async () => {
    const guest = await createGuest("idempotent");
    const tableSession = await confirmedTableSession(guest.id, `T-idem-${RUN_ID}`);
    const posExternalId = `receipt-idem-${RUN_ID}`;

    const first = await importPosReceipt({
      posExternalId,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 250,
      items: [{ name: "Мохіто", price: 250, quantity: 1 }],
    });
    const second = await importPosReceipt({
      posExternalId,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 250,
      items: [{ name: "Мохіто", price: 250, quantity: 1 }],
    });

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.receiptId).toBe(first.receiptId);

    const count = await prisma.receipt.count({ where: { posExternalId } });
    expect(count).toBe(1);
  });

  it("отклоняет импорт по неподтверждённой сессии стола", async () => {
    const guest = await createGuest("pending-session");
    const pending = await prisma.tableSession.create({
      data: { tableCode: `T-pending-${RUN_ID}`, userId: guest.id },
    });

    await expect(
      importPosReceipt({
        posExternalId: `receipt-pending-${RUN_ID}`,
        tableSessionId: pending.id,
        date: new Date().toISOString(),
        totalAmount: 100,
        items: [{ name: "Лимонад", price: 100, quantity: 1 }],
      }),
    ).rejects.toThrow();
  });
});

describe("Gold Member: автоматическое присвоение и cashback (FR-007, FR-008)", () => {
  it("присваивает Gold ровно на 7-м подтверждённом чеке за месяц и начисляет cashback", async () => {
    const guest = await createGuest("gold-promotion");
    const tableSession = await confirmedTableSession(guest.id, `T-gold-${RUN_ID}`);
    const month = new Date().toISOString().slice(0, 7);

    for (let i = 1; i <= GOLD_THRESHOLD - 1; i += 1) {
      await importPosReceipt({
        posExternalId: `receipt-gold-${RUN_ID}-${i}`,
        tableSessionId: tableSession.id,
        date: `${month}-01T12:00:00Z`,
        totalAmount: 100,
        items: [{ name: "Позиція", price: 100, quantity: 1 }],
      });
    }

    const beforeSeventh = await prisma.user.findUniqueOrThrow({ where: { id: guest.id } });
    expect(beforeSeventh.role).toBe("MEMBER");

    const seventh = await importPosReceipt({
      posExternalId: `receipt-gold-${RUN_ID}-${GOLD_THRESHOLD}`,
      tableSessionId: tableSession.id,
      date: `${month}-01T12:00:00Z`,
      totalAmount: 100,
      items: [{ name: "Позиція", price: 100, quantity: 1 }],
    });

    const afterSeventh = await prisma.user.findUniqueOrThrow({ where: { id: guest.id } });
    expect(afterSeventh.role).toBe("GOLD_MEMBER");
    expect(afterSeventh.goldSinceMonth).toBe(month);

    const auditEntry = await prisma.auditLogEntry.findFirst({
      where: { targetUserId: guest.id, action: "ROLE_CHANGED" },
    });
    expect(auditEntry).not.toBeNull();

    const accrual = await prisma.bonusTransaction.findUnique({
      where: { receiptId_type: { receiptId: seventh.receiptId, type: "ACCRUAL" } },
    });
    expect(accrual).not.toBeNull();
    expect(Number(accrual!.amount)).toBeGreaterThan(0);
  });

  it("не понижает уже присвоенный Gold и не пишет повторный audit log при пересчёте", async () => {
    const guest = await createGuest("gold-permanent");
    await prisma.user.update({
      where: { id: guest.id },
      data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" },
    });

    const tableSession = await confirmedTableSession(guest.id, `T-permanent-${RUN_ID}`);
    await importPosReceipt({
      posExternalId: `receipt-permanent-${RUN_ID}`,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 50,
      items: [{ name: "Кава", price: 50, quantity: 1 }],
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: guest.id } });
    expect(user.role).toBe("GOLD_MEMBER");
    expect(user.goldSinceMonth).toBe("2026-01");

    const roleChanges = await prisma.auditLogEntry.count({
      where: { targetUserId: guest.id, action: "ROLE_CHANGED" },
    });
    expect(roleChanges).toBe(0);
  });

  it("не учитывает чеки с нулевой или отрицательной суммой в подсчёте Gold и cashback", async () => {
    const guest = await createGuest("zero-amount");
    const tableSession = await confirmedTableSession(guest.id, `T-zero-${RUN_ID}`);

    const receipt = await importPosReceipt({
      posExternalId: `receipt-zero-${RUN_ID}`,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 0,
      items: [{ name: "Сторно", price: 0, quantity: 1 }],
    });

    const stored = await prisma.receipt.findUniqueOrThrow({ where: { id: receipt.receiptId } });
    expect(stored.countsTowardGoldMonth).toBeNull();

    const accrual = await prisma.bonusTransaction.findUnique({
      where: { receiptId_type: { receiptId: receipt.receiptId, type: "ACCRUAL" } },
    });
    expect(accrual).toBeNull();
  });
});

describe("refundPosReceipt: полная сторно-запись (решено 2026-07-23)", () => {
  it("создаёт сторно-запись на всю сумму начисления и не сторнирует дважды", async () => {
    const guest = await createGuest("refund");
    await prisma.user.update({ where: { id: guest.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const tableSession = await confirmedTableSession(guest.id, `T-refund-${RUN_ID}`);

    const receipt = await importPosReceipt({
      posExternalId: `receipt-refund-${RUN_ID}`,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 200,
      items: [{ name: "Шот", price: 200, quantity: 1 }],
    });

    const accrual = await prisma.bonusTransaction.findUniqueOrThrow({
      where: { receiptId_type: { receiptId: receipt.receiptId, type: "ACCRUAL" } },
    });

    await refundPosReceipt(`receipt-refund-${RUN_ID}`);
    await refundPosReceipt(`receipt-refund-${RUN_ID}`); // повторная доставка события

    const refundedReceipt = await prisma.receipt.findUniqueOrThrow({ where: { id: receipt.receiptId } });
    expect(refundedReceipt.status).toBe("REFUNDED");

    const reversal = await prisma.bonusTransaction.findUniqueOrThrow({
      where: { receiptId_type: { receiptId: receipt.receiptId, type: "REVERSAL" } },
    });
    expect(Number(reversal.amount)).toBe(-Number(accrual.amount));

    const reversalCount = await prisma.bonusTransaction.count({
      where: { receiptId: receipt.receiptId, type: "REVERSAL" },
    });
    expect(reversalCount).toBe(1);
  });
});

describe("Доступ к чужому чеку запрещён (FR-002, SC-002)", () => {
  it("чек виден только своему владельцу, а не другому гостю", async () => {
    const owner = await createGuest("receipt-owner");
    const stranger = await createGuest("receipt-stranger");
    const tableSession = await confirmedTableSession(owner.id, `T-owner-${RUN_ID}`);

    const receipt = await importPosReceipt({
      posExternalId: `receipt-owner-${RUN_ID}`,
      tableSessionId: tableSession.id,
      date: new Date().toISOString(),
      totalAmount: 80,
      items: [{ name: "Пиво", price: 80, quantity: 1 }],
    });

    const asOwner = await prisma.receipt.findFirst({ where: { id: receipt.receiptId, userId: owner.id } });
    const asStranger = await prisma.receipt.findFirst({ where: { id: receipt.receiptId, userId: stranger.id } });

    expect(asOwner).not.toBeNull();
    expect(asStranger).toBeNull();
  });
});

describe("issueTelegramBotLinkToken: Gold-only endpoint (FR-010)", () => {
  it("отклоняет обычного Member", async () => {
    const member = await createGuest("bot-link-member");
    await expect(issueTelegramBotLinkToken(member.id)).rejects.toThrow(TelegramBotLinkError);
    await expect(issueTelegramBotLinkToken(member.id)).rejects.toMatchObject({ code: "NOT_GOLD_MEMBER" });
  });

  it("отклоняет Gold Member без вказаного телефону", async () => {
    const gold = await createGuest("bot-link-no-phone");
    await prisma.user.update({
      where: { id: gold.id },
      data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01", phone: null },
    });

    await expect(issueTelegramBotLinkToken(gold.id)).rejects.toMatchObject({ code: "PHONE_NOT_SET" });
  });

  it("выдаёт токен Gold Member з указаним телефоном (ще не підтвердженим)", async () => {
    const gold = await createGuest("bot-link-issued");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });

    const { rawToken, expiresAt } = await issueTelegramBotLinkToken(gold.id);
    expect(rawToken).toHaveLength(64);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const stored = await prisma.telegramBotLinkToken.findFirst({ where: { userId: gold.id } });
    expect(stored).not.toBeNull();
    expect(stored!.tokenHash).not.toBe(rawToken);
  });
});

describe("confirmTelegramBotContact: подтверждение телефона + привязка (FR-012)", () => {
  it("подтверждает при совпадении номера и telegramId, помечает телефон подтверждённым", async () => {
    const gold = await createGuest("bot-confirm-ok");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);

    const result = await confirmTelegramBotContact({
      rawToken,
      telegramUserId: gold.telegramId!,
      phone: gold.phone!,
    });
    expect(result.userId).toBe(gold.id);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: gold.id } });
    expect(updated.phoneVerifiedAt).not.toBeNull();
    expect(updated.telegramBotLinkedAt).not.toBeNull();

    const phoneVerifiedLog = await prisma.auditLogEntry.findFirst({
      where: { targetUserId: gold.id, action: "PHONE_VERIFIED" },
    });
    const botLinkedLog = await prisma.auditLogEntry.findFirst({
      where: { targetUserId: gold.id, action: "BOT_LINKED" },
    });
    expect(phoneVerifiedLog).not.toBeNull();
    expect(botLinkedLog).not.toBeNull();
  });

  it("отклоняет несовпадающий номер телефона общей ошибкой", async () => {
    const gold = await createGuest("bot-confirm-wrong-phone");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);

    await expect(
      confirmTelegramBotContact({ rawToken, telegramUserId: gold.telegramId!, phone: "+380669999999" }),
    ).rejects.toMatchObject({ code: "LINK_FAILED" });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: gold.id } });
    expect(updated.phoneVerifiedAt).toBeNull();
  });

  it("отклоняет несовпадающий Telegram user id", async () => {
    const gold = await createGuest("bot-confirm-wrong-telegram-id");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);

    await expect(
      confirmTelegramBotContact({ rawToken, telegramUserId: "someone-elses-telegram-id", phone: gold.phone! }),
    ).rejects.toMatchObject({ code: "LINK_FAILED" });
  });

  it("отклоняет повторное использование того же токена", async () => {
    const gold = await createGuest("bot-confirm-reuse");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);

    await confirmTelegramBotContact({ rawToken, telegramUserId: gold.telegramId!, phone: gold.phone! });

    await expect(
      confirmTelegramBotContact({ rawToken, telegramUserId: gold.telegramId!, phone: gold.phone! }),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED_OR_USED" });
  });

  it("отклоняет несуществующий/поддельный токен", async () => {
    await expect(
      confirmTelegramBotContact({ rawToken: "not-a-real-token", telegramUserId: "x", phone: "+380669999999" }),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED_OR_USED" });
  });
});

describe("bindTelegramBotLinkChat + confirmTelegramBotContactByChat: реальный бот-адаптер (Промт 6)", () => {
  it("привязывает chat_id на /start и подтверждает по нему же", async () => {
    const gold = await createGuest("bot-chat-ok");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);

    const chatId = `chat-${RUN_ID}-ok`;
    const bound = await bindTelegramBotLinkChat(rawToken, chatId);
    expect(bound).toBe(true);

    const result = await confirmTelegramBotContactByChat(chatId, {
      telegramUserId: gold.telegramId!,
      phone: gold.phone!,
    });
    expect(result.userId).toBe(gold.id);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: gold.id } });
    expect(updated.telegramBotLinkedAt).not.toBeNull();
  });

  it("отклоняет /start с несуществующим/поддельным токеном", async () => {
    const bound = await bindTelegramBotLinkChat("not-a-real-token", `chat-${RUN_ID}-fake`);
    expect(bound).toBe(false);
  });

  it("не подтверждает по чату, для которого не было /start", async () => {
    await expect(
      confirmTelegramBotContactByChat(`chat-${RUN_ID}-unknown`, { telegramUserId: "x", phone: "+380669999999" }),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED_OR_USED" });
  });

  it("отклоняет повторное подтверждение по тому же чату после использования токена", async () => {
    const gold = await createGuest("bot-chat-reuse");
    await prisma.user.update({ where: { id: gold.id }, data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01" } });
    const { rawToken } = await issueTelegramBotLinkToken(gold.id);
    const chatId = `chat-${RUN_ID}-reuse`;
    await bindTelegramBotLinkChat(rawToken, chatId);

    await confirmTelegramBotContactByChat(chatId, { telegramUserId: gold.telegramId!, phone: gold.phone! });

    await expect(
      confirmTelegramBotContactByChat(chatId, { telegramUserId: gold.telegramId!, phone: gold.phone! }),
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED_OR_USED" });
  });
});

describe("unlinkTelegramBot: отвязка по инициативе гостя (FR-027)", () => {
  it("сбрасывает telegramBotLinkedAt и пишет audit log", async () => {
    const gold = await createGuest("bot-unlink");
    await prisma.user.update({
      where: { id: gold.id },
      data: { role: "GOLD_MEMBER", goldSinceMonth: "2026-01", telegramBotLinkedAt: new Date() },
    });

    await unlinkTelegramBot(gold.id);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: gold.id } });
    expect(updated.telegramBotLinkedAt).toBeNull();

    const log = await prisma.auditLogEntry.findFirst({ where: { targetUserId: gold.id, action: "BOT_UNLINKED" } });
    expect(log).not.toBeNull();
  });

  it("отклоняет отвязку, если бот не был привязан", async () => {
    const member = await createGuest("bot-unlink-not-linked");
    await expect(unlinkTelegramBot(member.id)).rejects.toMatchObject({ code: "NOT_LINKED" });
  });
});
