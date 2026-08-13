import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { upsertSiteContent, upsertPromoBanner, removePromoBanner } from "@/lib/site-content-sync";

const RUN_ID = Date.now();
const bannerExternalIds: string[] = [];

// SiteContent(id: "default") — той самий сингл-рядок, що використовує весь сайт (lib/site-content.ts).
// Знімаємо й відновлюємо brand-поля навколо тестів, той самий підхід, що withLoyaltySettings у
// CastaPOS tests/unit/loyalty.test.ts — цей рядок спільний з живою dev-БД, не фікстура.
let originalBranding: { venueName: string | null; tagline: string | null; logoUrl: string | null };

beforeAll(async () => {
  const current = await prisma.siteContent.findUniqueOrThrow({ where: { id: "default" } });
  originalBranding = { venueName: current.venueName, tagline: current.tagline, logoUrl: current.logoUrl };
});

afterAll(async () => {
  await prisma.siteContent.update({ where: { id: "default" }, data: originalBranding });
});

afterEach(async () => {
  if (bannerExternalIds.length > 0) {
    await prisma.promoBanner.deleteMany({ where: { posExternalId: { in: bannerExternalIds } } });
    bannerExternalIds.length = 0;
  }
});

describe("upsertSiteContent: приймання push-подій від CastaPOS (lib/site-sync.ts:syncSiteSettings)", () => {
  it("оновлює лише надіслані поля, не займає обов'язкові колонки, яких не було в payload", async () => {
    const before = await prisma.siteContent.findUniqueOrThrow({ where: { id: "default" } });

    await upsertSiteContent({ venueName: `Тестовий заклад ${RUN_ID}`, tagline: "Тестовий теглайн" });

    const after = await prisma.siteContent.findUniqueOrThrow({ where: { id: "default" } });
    expect(after.venueName).toBe(`Тестовий заклад ${RUN_ID}`);
    expect(after.tagline).toBe("Тестовий теглайн");
    // Обов'язкові поля, яких не було в payload, лишаються незмінними — не занулені.
    expect(after.address).toBe(before.address);
    expect(after.aboutText).toBe(before.aboutText);
  });

  it("null явно очищає необов'язкове поле (напр. лого прибрали)", async () => {
    await upsertSiteContent({ logoUrl: "https://example.com/logo.png" });
    expect((await prisma.siteContent.findUniqueOrThrow({ where: { id: "default" } })).logoUrl).toBe("https://example.com/logo.png");

    await upsertSiteContent({ logoUrl: null });
    expect((await prisma.siteContent.findUniqueOrThrow({ where: { id: "default" } })).logoUrl).toBeNull();
  });
});

describe("upsertPromoBanner / removePromoBanner: слайдер акцій", () => {
  it("створює банер і повторний виклик з тим самим bannerExternalId оновлює, не дублює", async () => {
    const bannerExternalId = `banner-${RUN_ID}-a`;
    bannerExternalIds.push(bannerExternalId);

    await upsertPromoBanner({ bannerExternalId, title: "Акція", description: "Опис", imageUrl: null, order: 0 });
    await upsertPromoBanner({ bannerExternalId, title: "Акція оновлена", description: null, imageUrl: "https://example.com/b.webp", order: 1 });

    const count = await prisma.promoBanner.count({ where: { posExternalId: bannerExternalId } });
    expect(count).toBe(1);

    const banner = await prisma.promoBanner.findUniqueOrThrow({ where: { posExternalId: bannerExternalId } });
    expect(banner.title).toBe("Акція оновлена");
    expect(banner.description).toBeNull();
    expect(banner.imageUrl).toBe("https://example.com/b.webp");
    expect(banner.isActive).toBe(true);
  });

  it("видаляє банер за bannerExternalId ідемпотентно (повторний виклик не падає)", async () => {
    const bannerExternalId = `banner-${RUN_ID}-remove`;
    bannerExternalIds.push(bannerExternalId);

    await upsertPromoBanner({ bannerExternalId, title: "Тимчасова акція", description: null, imageUrl: null, order: 0 });
    await removePromoBanner(bannerExternalId);

    expect(await prisma.promoBanner.findUnique({ where: { posExternalId: bannerExternalId } })).toBeNull();
    await expect(removePromoBanner(bannerExternalId)).resolves.not.toThrow();
  });
});
