import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/request-security";

const REQUEST_TYPES = ["TABLE_BOOKING", "HOOKAH_RENTAL"] as const;
type RequestType = (typeof REQUEST_TYPES)[number];

function isRequestType(value: unknown): value is RequestType {
  return typeof value === "string" && (REQUEST_TYPES as readonly string[]).includes(value);
}

// Послуги (бронювання столу, оренда кальяну) доступні лише Gold Member.
export async function POST(request: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "GOLD_MEMBER") {
    return NextResponse.json(
      { error: { code: "NOT_GOLD_MEMBER", message: "Послуги доступні лише Gold Member" } },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { type?: string; comment?: string };
  if (!isRequestType(body.type)) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Невідомий тип послуги" } },
      { status: 400 },
    );
  }
  const comment = body.comment?.trim().slice(0, 500) || null;

  const limit = await consumeRateLimit({
    namespace: "service-request",
    identifier: session.user.id,
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Забагато спроб, спробуйте пізніше" } },
      { status: 429 },
    );
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: { userId: session.user.id, type: body.type, comment },
  });

  return NextResponse.json({ id: serviceRequest.id, status: serviceRequest.status }, { status: 201 });
}

// Історія власних запитів гостя (найновіші перші).
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    requests.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      comment: item.comment,
      requestedAt: item.requestedAt,
    })),
  );
}
