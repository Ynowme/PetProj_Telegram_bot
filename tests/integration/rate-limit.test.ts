import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/request-security";

// Інтеграційні тести проти реальної dev-БД (Prisma-backed rate limiting).
// Кожен тест використовує унікальний namespace, щоб не залежати від інших тестів/ручного тестування,
// і прибирає за собою рядки RateLimit.
const testNamespaces: string[] = [];

function uniqueNamespace(base: string): string {
  const ns = `test:${base}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  testNamespaces.push(ns);
  return ns;
}

afterEach(async () => {
  // Ключі зберігаються як `${namespace}:${hmac}`, тому чистимо за префіксом namespace.
  for (const ns of testNamespaces.splice(0)) {
    await prisma.rateLimit.deleteMany({ where: { key: { startsWith: `${ns}:` } } });
  }
});

describe("consumeRateLimit", () => {
  it("allows requests within the limit", async () => {
    const namespace = uniqueNamespace("within-limit");

    const first = await consumeRateLimit({ namespace, identifier: "user-a", limit: 3, windowMs: 60_000 });
    const second = await consumeRateLimit({ namespace, identifier: "user-a", limit: 3, windowMs: 60_000 });
    const third = await consumeRateLimit({ namespace, identifier: "user-a", limit: 3, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(true);
  });

  it("blocks requests once the limit is exceeded", async () => {
    const namespace = uniqueNamespace("exceeds-limit");

    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ namespace, identifier: "user-b", limit: 3, windowMs: 60_000 });
    }
    const fourth = await consumeRateLimit({ namespace, identifier: "user-b", limit: 3, windowMs: 60_000 });

    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate identifiers independently within the same namespace", async () => {
    const namespace = uniqueNamespace("separate-identifiers");

    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit({ namespace, identifier: "user-c", limit: 3, windowMs: 60_000 });
    }
    const blockedUserC = await consumeRateLimit({ namespace, identifier: "user-c", limit: 3, windowMs: 60_000 });
    const freshUserD = await consumeRateLimit({ namespace, identifier: "user-d", limit: 3, windowMs: 60_000 });

    expect(blockedUserC.allowed).toBe(false);
    expect(freshUserD.allowed).toBe(true);
  });

  it("resets the counter once the window has passed", async () => {
    const namespace = uniqueNamespace("window-reset");
    const shortWindowMs = 50;

    const first = await consumeRateLimit({ namespace, identifier: "user-e", limit: 1, windowMs: shortWindowMs });
    const secondWithinWindow = await consumeRateLimit({
      namespace,
      identifier: "user-e",
      limit: 1,
      windowMs: shortWindowMs,
    });
    expect(first.allowed).toBe(true);
    expect(secondWithinWindow.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, shortWindowMs + 20));

    const afterWindow = await consumeRateLimit({
      namespace,
      identifier: "user-e",
      limit: 1,
      windowMs: shortWindowMs,
    });
    expect(afterWindow.allowed).toBe(true);
  });
});
