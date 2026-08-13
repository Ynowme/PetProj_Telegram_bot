import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { readVerifiedWebhookBody } from "@/lib/webhook-security";

type PhotoBody = { assetKey: string; contentType: string; dataBase64: string };

const ALLOWED_CONTENT_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const MAX_BYTES = 5 * 1024 * 1024;

function isValidPayload(value: unknown): value is PhotoBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.assetKey === "string" &&
    v.assetKey.length > 0 &&
    typeof v.contentType === "string" &&
    ALLOWED_CONTENT_TYPES.has(v.contentType) &&
    typeof v.dataBase64 === "string" &&
    v.dataBase64.length > 0
  );
}

// Приймає будь-яке зображення від CastaPOS (lib/site-sync.ts:pushAsset): фото товару/тех.карти
// (product-${id}/recipe-${id}), брендинг сайту (site-logo/site-favicon/site-hero), картинка
// банера (banner-${id}). Локальні завантаження CastaPOS живуть на диску бару, недоступному з
// інтернету, а сайт на Vercel не має диска взагалі — Blob тут єдине спільне сховище. Іменуємо
// блоб за assetKey, щоб повторна відправка того самого asset'а перезаписувала той самий об'єкт,
// а не плодила сирітські файли в Blob-сховищі.
export async function POST(request: NextRequest) {
  const { payload, response } = await readVerifiedWebhookBody(request, {
    secret: process.env.POS_WEBHOOK_SECRET,
    isValid: isValidPayload,
  });
  if (response) return response;

  const bytes = Buffer.from(payload.dataBase64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  }

  const ext = payload.contentType === "image/jpeg" ? "jpg" : payload.contentType === "image/png" ? "png" : "webp";
  const blob = await put(`assets/${payload.assetKey}.${ext}`, bytes, {
    access: "public",
    contentType: payload.contentType,
    allowOverwrite: true,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
