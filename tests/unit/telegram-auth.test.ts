import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isTelegramAuthPayload, verifyTelegramAuth, type TelegramAuthPayload } from "@/lib/telegram-auth";

const BOT_TOKEN = "123456:test-bot-token";

function sign(payload: Omit<TelegramAuthPayload, "hash">): TelegramAuthPayload {
  const checkString = Object.keys(payload)
    .filter((key) => payload[key as keyof typeof payload] !== undefined)
    .sort()
    .map((key) => `${key}=${payload[key as keyof typeof payload]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  return { ...payload, hash };
}

describe("isTelegramAuthPayload", () => {
  it("accepts a well-formed payload", () => {
    expect(isTelegramAuthPayload({ id: 42, auth_date: 123, hash: "abc" })).toBe(true);
  });

  it("rejects payloads missing required fields", () => {
    expect(isTelegramAuthPayload({ id: 42 })).toBe(false);
    expect(isTelegramAuthPayload(null)).toBe(false);
    expect(isTelegramAuthPayload("not-an-object")).toBe(false);
  });
});

describe("verifyTelegramAuth", () => {
  it("accepts a payload with a valid, fresh signature", () => {
    const payload = sign({ id: 42, first_name: "Гість", auth_date: Math.floor(Date.now() / 1000) });
    expect(verifyTelegramAuth(payload, BOT_TOKEN)).toBe(true);
  });

  it("rejects a payload signed with a different bot token", () => {
    const payload = sign({ id: 42, auth_date: Math.floor(Date.now() / 1000) });
    expect(verifyTelegramAuth(payload, "another-bot-token")).toBe(false);
  });

  it("rejects a tampered payload (id changed after signing)", () => {
    const payload = sign({ id: 42, auth_date: Math.floor(Date.now() / 1000) });
    const tampered = { ...payload, id: 999 };
    expect(verifyTelegramAuth(tampered, BOT_TOKEN)).toBe(false);
  });

  it("rejects an expired auth_date (replay protection)", () => {
    const twoDaysAgo = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;
    const payload = sign({ id: 42, auth_date: twoDaysAgo });
    expect(verifyTelegramAuth(payload, BOT_TOKEN)).toBe(false);
  });

  it("rejects when no bot token is configured", () => {
    const payload = sign({ id: 42, auth_date: Math.floor(Date.now() / 1000) });
    expect(verifyTelegramAuth(payload, undefined)).toBe(false);
  });

  it("rejects a malformed hash without throwing", () => {
    const payload = sign({ id: 42, auth_date: Math.floor(Date.now() / 1000) });
    expect(() => verifyTelegramAuth({ ...payload, hash: "not-hex!" }, BOT_TOKEN)).not.toThrow();
    expect(verifyTelegramAuth({ ...payload, hash: "not-hex!" }, BOT_TOKEN)).toBe(false);
  });
});
