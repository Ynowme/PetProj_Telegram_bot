import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export type DayHours = { open: string; close: string } | null;
export type WorkingHoursByDay = Record<DayKey, DayHours>;

// Приймає push-подію брендингу від CastaPOS (lib/site-sync.ts:syncSiteSettings у тому
// репозиторії). CastaPOS — джерело правди (AppSettings), ми лише оновлюємо єдиний рядок
// SiteContent(id: "default"). Поля, обов'язкові в цій моделі (address/addressMapUrl/mapEmbedUrl/
// workingHours/phone/allergyDisclaimer/aboutText), CastaPOS шле лише коли вони реально заповнені
// в нього — тут вони просто не приходять у payload (undefined), тож Prisma їх не чіпає й не
// намагається занулити NOT NULL колонку.
export type SiteContentPayload = {
  venueName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  heroImageUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  googleUrl?: string | null;
  telegramUrl?: string | null;
  accentColor?: string | null;
  workingHoursByDay?: WorkingHoursByDay | null;
  privacyPolicyText?: string | null;
  termsOfUseText?: string | null;
  cookiePolicyText?: string | null;
  aboutText?: string;
  address?: string;
  addressMapUrl?: string;
  mapEmbedUrl?: string;
  workingHours?: string;
  phone?: string;
  allergyDisclaimer?: string;
};

export async function upsertSiteContent(payload: SiteContentPayload): Promise<void> {
  await prisma.siteContent.update({
    where: { id: "default" },
    data: {
      ...payload,
      workingHoursByDay:
        payload.workingHoursByDay === undefined
          ? undefined
          : payload.workingHoursByDay === null
            ? Prisma.JsonNull
            : (payload.workingHoursByDay as Prisma.InputJsonValue),
    },
  });
}

export type PromoBannerUpsertPayload = {
  bannerExternalId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
};

// Той самий idempotency-патерн, що lib/menu-sync.ts:upsertMenuItem — posExternalId є ключем.
export async function upsertPromoBanner(payload: PromoBannerUpsertPayload): Promise<void> {
  await prisma.promoBanner.upsert({
    where: { posExternalId: payload.bannerExternalId },
    update: { title: payload.title, description: payload.description, imageUrl: payload.imageUrl, order: payload.order, isActive: true },
    create: {
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl,
      order: payload.order,
      isActive: true,
      posExternalId: payload.bannerExternalId,
    },
  });
}

// Ідемпотентно — видалення вже видаленого/ніколи не існуючого банера не помилка (той самий
// підхід, що removeMenuItem/refundPosReceipt).
export async function removePromoBanner(bannerExternalId: string): Promise<void> {
  await prisma.promoBanner.deleteMany({ where: { posExternalId: bannerExternalId } });
}
