import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { upsertSiteContent, DAY_KEYS, type SiteContentPayload, type WorkingHoursByDay } from "@/lib/site-content-sync";

const OPTIONAL_NULLABLE_KEYS = [
  "venueName", "tagline", "logoUrl", "faviconUrl", "heroImageUrl", "instagramUrl", "facebookUrl", "googleUrl",
  "telegramUrl", "accentColor", "privacyPolicyText", "termsOfUseText", "cookiePolicyText",
] as const;
const OPTIONAL_STRING_KEYS = ["aboutText", "address", "addressMapUrl", "mapEmbedUrl", "workingHours", "phone", "allergyDisclaimer"] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDayHours(value: unknown): boolean {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.open === "string" && TIME_RE.test(v.open) && typeof v.close === "string" && TIME_RE.test(v.close);
}

// Рівно 7 відомих ключів (DAY_KEYS), кожен null (вихідний) або {open,close} — жоден день не
// перевіряється рекурсивно як "категорія з батьком" (той самий клас багів, що зловився на
// menu-sync minulого разу): тут рівно один рівень вкладеності, перевіряємо його явно.
function isValidWorkingHoursByDay(value: unknown): value is WorkingHoursByDay {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const keys = Object.keys(v);
  return keys.length === DAY_KEYS.length && DAY_KEYS.every((day) => day in v) && DAY_KEYS.every((day) => isValidDayHours(v[day]));
}

function isValidPayload(value: unknown): value is SiteContentPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  for (const key of OPTIONAL_NULLABLE_KEYS) {
    if (key in v && v[key] !== null && typeof v[key] !== "string") return false;
  }
  for (const key of OPTIONAL_STRING_KEYS) {
    if (key in v && (typeof v[key] !== "string" || (v[key] as string).length === 0)) return false;
  }
  if ("workingHoursByDay" in v && v.workingHoursByDay !== null && !isValidWorkingHoursByDay(v.workingHoursByDay)) return false;
  if ("guestOrderingEnabled" in v && typeof v.guestOrderingEnabled !== "boolean") return false;
  return true;
}

// Push-подія брендингу від CastaPOS (lib/site-sync.ts:syncSiteSettings). На відміну від
// menu-sync/table-*/receipt — тут немає подій upsert/remove, це завжди повний (частковий за
// заповненістю) знімок поточного стану AppSettings, просто оновлюємо єдиний рядок SiteContent.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  await upsertSiteContent(payload);
  return NextResponse.json({ ok: true });
}
