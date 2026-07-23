import { describe, expect, it } from "vitest";
import { computeActiveNavIndex, type NavItem } from "@/lib/nav";

const items: NavItem[] = [
  { label: "Меню", href: "/menu" },
  { label: "Популярне", href: "/menu/popular" },
  { label: "Кабінет", href: "/account" },
  { label: "Вийти", href: "#", kind: "signout" },
];

describe("computeActiveNavIndex", () => {
  it("matches the exact home route only for '/'", () => {
    expect(computeActiveNavIndex([{ label: "Home", href: "/" }], "/")).toBe(0);
    expect(computeActiveNavIndex([{ label: "Home", href: "/" }], "/menu")).toBe(-1);
  });

  it("matches a category page under the parent /menu item", () => {
    expect(computeActiveNavIndex(items, "/menu/cocktails")).toBe(0);
  });

  it("prefers the more specific /menu/popular match over /menu", () => {
    expect(computeActiveNavIndex(items, "/menu/popular")).toBe(1);
  });

  it("matches nested account routes", () => {
    expect(computeActiveNavIndex(items, "/account/bonuses")).toBe(2);
  });

  it("never matches a '#' placeholder href", () => {
    expect(computeActiveNavIndex(items, "#")).toBe(-1);
  });

  it("returns -1 when nothing matches", () => {
    expect(computeActiveNavIndex(items, "/login")).toBe(-1);
  });
});
