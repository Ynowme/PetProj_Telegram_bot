import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { upsertPromoBanner, removePromoBanner } from "@/lib/site-content-sync";

type UpsertBody = { event: "BANNER_UPSERTED"; bannerExternalId: string; title: string; description: string | null; imageUrl: string | null; order: number };
type RemovedBody = { event: "BANNER_REMOVED"; bannerExternalId: string };
type PromoBannerBody = UpsertBody | RemovedBody;

function isValidPayload(value: unknown): value is PromoBannerBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.bannerExternalId !== "string" || v.bannerExternalId.length === 0) return false;

  if (v.event === "BANNER_REMOVED") return true;
  if (v.event !== "BANNER_UPSERTED") return false;

  return (
    typeof v.title === "string" &&
    v.title.trim().length > 0 &&
    (v.description === null || typeof v.description === "string") &&
    (v.imageUrl === null || typeof v.imageUrl === "string") &&
    typeof v.order === "number"
  );
}

// Push-подія від CastaPOS (lib/site-sync.ts:syncPromoBanner) — та сама модель видимості, що
// menu-sync: CastaPOS сам вирішує upsert/remove залежно від isActive, тут лише ідемпотентно
// дзеркалимо. bannerExternalId — ключ ідемпотентності (CastaPOS PromoBanner.id).
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  if (payload.event === "BANNER_REMOVED") {
    await removePromoBanner(payload.bannerExternalId);
    return NextResponse.json({ ok: true });
  }

  await upsertPromoBanner(payload);
  return NextResponse.json({ ok: true });
}
