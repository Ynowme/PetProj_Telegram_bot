import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone } from "@/lib/request-security";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
  });
});

describe("normalizePhone", () => {
  it("accepts a valid Ukrainian E.164 number as-is", () => {
    expect(normalizePhone("+380668063629")).toBe("+380668063629");
  });

  it("strips spaces, dots, dashes and parentheses", () => {
    expect(normalizePhone("+380 (66) 806-36.29")).toBe("+380668063629");
  });

  it("rejects numbers without the +380 country code", () => {
    expect(normalizePhone("0668063629")).toBeNull();
  });

  it("rejects numbers with the wrong digit count", () => {
    expect(normalizePhone("+38066806362")).toBeNull();
    expect(normalizePhone("+3806680636299")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(normalizePhone("+380abcdefghi")).toBeNull();
  });
});
