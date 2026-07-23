import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegramMessage } from "@/lib/telegram-bot-client";

const ORIGINAL_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

describe("sendTelegramMessage", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  });

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = ORIGINAL_TOKEN;
    vi.restoreAllMocks();
  });

  it("does nothing when no bot token is configured", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const fetchSpy = vi.spyOn(global, "fetch");

    await sendTelegramMessage({ chatId: "1", text: "hi" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends a plain message with keyboard removed when no button requested", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    await sendTelegramMessage({ chatId: "42", text: "hello" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://api.telegram.org/bottest-bot-token/sendMessage");
    const body = JSON.parse(String(init?.body));
    expect(body.chat_id).toBe("42");
    expect(body.text).toBe("hello");
    expect(body.reply_markup).toEqual({ remove_keyboard: true });
  });

  it("attaches a request_contact button when requested", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    await sendTelegramMessage({ chatId: "42", text: "share phone", requestContactButtonText: "Share" });

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.reply_markup.keyboard).toEqual([[{ text: "Share", request_contact: true }]]);
    expect(body.reply_markup.resize_keyboard).toBe(true);
    expect(body.reply_markup.one_time_keyboard).toBe(true);
  });

  it("throws when Telegram responds with a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 400 }));

    await expect(sendTelegramMessage({ chatId: "1", text: "hi" })).rejects.toThrow();
  });
});
