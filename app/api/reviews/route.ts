import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/request-security";
import { createReview } from "@/lib/reviews";

type CreateReviewBody = {
  dishesRating: number;
  serviceRating: number;
  comment?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function isValidBody(value: unknown): value is CreateReviewBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isValidRating(v.dishesRating) &&
    isValidRating(v.serviceRating) &&
    (v.comment === undefined || v.comment === null || (typeof v.comment === "string" && v.comment.length <= 2000)) &&
    (v.contactName === undefined || v.contactName === null || (typeof v.contactName === "string" && v.contactName.length <= 200)) &&
    (v.contactPhone === undefined || v.contactPhone === null || (typeof v.contactPhone === "string" && v.contactPhone.length <= 30))
  );
}

// Vercel (і більшість проксі) ставлять реальний IP першим у x-forwarded-for — фолбек на
// "unknown" об'єднає всіх клієнтів без заголовка в один rate-limit кошик, що для локального
// dev/тестів прийнятно (в проді за Vercel заголовок завжди є).
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
}

// Публічна форма відгуку (app/(public)/feedback) — логін не обов'язковий, так само як на
// прикладах ChoiceQR, що надихнули цю фічу; якщо гість залогінений, підтягуємо userId
// автоматично. Rate-limit по IP (не по сесії — вона не завжди є) захищає від спаму.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isValidBody(body)) {
    return NextResponse.json({ error: { code: "INVALID_INPUT" } }, { status: 400 });
  }

  const limit = await consumeRateLimit({
    namespace: "reviews-create",
    identifier: getClientIp(request),
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Забагато відгуків, спробуйте пізніше" } }, { status: 429 });
  }

  const session = await auth();
  const review = await createReview({ ...body, userId: session?.user?.id ?? null });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
