import { NextRequest, NextResponse } from "next/server";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";
import { upsertMenuItem, removeMenuItem, type MenuSyncCategoryPayload } from "@/lib/menu-sync";

type UpsertBody = {
  event: "ITEM_UPSERTED";
  itemExternalId: string;
  kind: "product" | "recipe";
  name: string;
  price: number;
  photoUrl: string | null;
  category: MenuSyncCategoryPayload;
};
type RemovedBody = { event: "ITEM_REMOVED"; itemExternalId: string };
type MenuSyncBody = UpsertBody | RemovedBody;

// Категорії вкладені щонайбільше на 2 рівні (CastaPOS lib/site-sync.ts:loadCategoryPayload сам так
// їх шле) — тому parent (якщо є) перевіряється як "листок", без очікування ЙОГО власного parent.
function isBareCategory(value: unknown): value is { externalId: string; name: string; order: number } {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.externalId === "string" && v.externalId.length > 0 && typeof v.name === "string" && v.name.trim().length > 0 && typeof v.order === "number";
}

function isValidCategory(value: unknown): value is MenuSyncCategoryPayload {
  if (!isBareCategory(value)) return false;
  const parent = (value as Record<string, unknown>).parent;
  return parent === null || isBareCategory(parent);
}

function isValidPayload(value: unknown): value is MenuSyncBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.itemExternalId !== "string" || v.itemExternalId.length === 0) return false;

  if (v.event === "ITEM_REMOVED") return true;
  if (v.event !== "ITEM_UPSERTED") return false;

  return (
    (v.kind === "product" || v.kind === "recipe") &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    typeof v.price === "number" &&
    Number.isFinite(v.price) &&
    v.price >= 0 &&
    (v.photoUrl === null || typeof v.photoUrl === "string") &&
    isValidCategory(v.category)
  );
}

// Push-подія від CastaPOS (lib/site-sync.ts) при увімкненні/вимкненні "Показувати на сайті" чи
// зміні товару/тех.карти, яка вже показується. itemExternalId — ключ ідемпотентності.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  if (payload.event === "ITEM_REMOVED") {
    await removeMenuItem(payload.itemExternalId);
    return NextResponse.json({ ok: true });
  }

  await upsertMenuItem(payload);
  return NextResponse.json({ ok: true });
}
