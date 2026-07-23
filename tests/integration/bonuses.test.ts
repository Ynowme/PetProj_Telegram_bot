import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getBonusBalance, getBonusHistory } from "@/lib/bonuses";
import { getBonusPercentage, setBonusPercentage } from "@/lib/bonus-settings";

const TEST_EMAIL = `vitest-bonus-${Date.now()}@example.com`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { name: "Vitest Bonus User", email: TEST_EMAIL, phone: `+380${Date.now().toString().slice(-9)}` },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.bonusTransaction.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("getBonusBalance / getBonusHistory", () => {
  it("returns 0 and an empty history for a user with no transactions", async () => {
    expect(await getBonusBalance(userId)).toBe(0);
    expect(await getBonusHistory(userId)).toEqual([]);
  });

  it("sums accruals into the balance and lists history newest-first", async () => {
    const first = await prisma.bonusTransaction.create({
      data: { userId, amount: 30, reason: "Нарахування 3% за чек" },
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await prisma.bonusTransaction.create({
      data: { userId, amount: 12.5, reason: "Нарахування 3% за чек" },
    });

    expect(await getBonusBalance(userId)).toBe(42.5);

    const history = await getBonusHistory(userId);
    expect(history.map((entry) => entry.id)).toEqual([second.id, first.id]);
  });
});

describe("getBonusPercentage / setBonusPercentage", () => {
  afterAll(async () => {
    // Повертаємо ставку до значення за замовчуванням, щоб не впливати на ручне тестування адмінки.
    await setBonusPercentage(3);
  });

  it("falls back to 3% when no settings row exists yet", async () => {
    await prisma.bonusSettings.deleteMany({ where: { id: "default" } });
    expect(await getBonusPercentage()).toBe(3);
  });

  it("persists an updated percentage", async () => {
    await setBonusPercentage(5);
    expect(await getBonusPercentage()).toBe(5);
  });
});
