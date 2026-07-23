import { describe, expect, it } from "vitest";
import { currentCalendarMonth, GOLD_THRESHOLD } from "@/lib/roles";

describe("currentCalendarMonth", () => {
  it("formats as YYYY-MM using UTC", () => {
    expect(currentCalendarMonth(new Date("2026-07-23T10:00:00Z"))).toBe("2026-07");
  });

  it("pads single-digit months", () => {
    expect(currentCalendarMonth(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01");
  });

  it("treats the last instant of a month as that month, not the next", () => {
    expect(currentCalendarMonth(new Date("2026-02-28T23:59:59Z"))).toBe("2026-02");
  });
});

describe("GOLD_THRESHOLD", () => {
  it("is 7 confirmed receipts per calendar month", () => {
    expect(GOLD_THRESHOLD).toBe(7);
  });
});
