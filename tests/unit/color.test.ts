import { describe, expect, it } from "vitest";
import { hexToRgb, rgbToHex, mix, lighten, darken, contrastTextColor, deriveAccentTheme } from "@/lib/color";

describe("hexToRgb", () => {
  it("parses a 6-digit hex with #", () => {
    expect(hexToRgb("#d4af37")).toEqual({ r: 212, g: 175, b: 55 });
  });

  it("parses a 6-digit hex without #", () => {
    expect(hexToRgb("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("returns null for invalid input", () => {
    expect(hexToRgb("not-a-color")).toBeNull();
    expect(hexToRgb("#fff")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });
});

describe("mix", () => {
  it("ratio 0 returns the original color unchanged", () => {
    expect(mix("#d4af37", { r: 255, g: 255, b: 255 }, 0)).toBe(rgbToHex({ r: 212, g: 175, b: 55 }));
  });

  it("ratio 1 returns exactly the target color", () => {
    expect(mix("#d4af37", { r: 255, g: 255, b: 255 }, 1)).toBe("#ffffff");
    expect(mix("#d4af37", { r: 0, g: 0, b: 0 }, 1)).toBe("#000000");
  });

  it("invalid hex passes through unchanged", () => {
    expect(mix("not-a-color", { r: 255, g: 255, b: 255 }, 0.5)).toBe("not-a-color");
  });
});

describe("lighten / darken", () => {
  it("lighten moves toward white, darken moves toward black", () => {
    expect(lighten("#000000", 0.5)).toBe("#808080");
    expect(darken("#ffffff", 0.5)).toBe("#808080");
  });
});

describe("contrastTextColor", () => {
  it("picks black text on a light background", () => {
    expect(contrastTextColor("#ffffff")).toBe("#000000");
    expect(contrastTextColor("#d4af37")).toBe("#000000"); // gold — light enough
  });

  it("picks white text on a dark background", () => {
    expect(contrastTextColor("#000000")).toBe("#ffffff");
    expect(contrastTextColor("#0b0d11")).toBe("#ffffff");
  });

  it("falls back to white for invalid hex", () => {
    expect(contrastTextColor("nope")).toBe("#ffffff");
  });
});

describe("deriveAccentTheme", () => {
  it("returns all four derived tokens for a valid hex", () => {
    const theme = deriveAccentTheme("#d4af37");
    expect(theme).not.toBeNull();
    expect(theme?.accent).toBe("#d4af37");
    expect(theme?.accentBright).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme?.accentMuted).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme?.accentContrast).toBe("#000000");
  });

  it("returns null for invalid hex", () => {
    expect(deriveAccentTheme("purple")).toBeNull();
  });
});
