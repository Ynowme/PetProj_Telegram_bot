import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { posProvider } from "@/lib/pos";
import { consumeRateLimit } from "@/lib/request-security";

// FR-004: гость запрашивает привязку к столу по публичному коду из QR.
export async function POST(request: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const body = (await request.json()) as { tableCode?: string };
  const tableCode = body.tableCode?.trim();
  if (!tableCode || tableCode.length > 64) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Вкажіть код столу" } },
      { status: 400 },
    );
  }

  const limit = await consumeRateLimit({
    namespace: "table-session-request",
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

  const tableStatus = await posProvider.isTableOpen(tableCode);
  if (!tableStatus.open) {
    return NextResponse.json(
      { error: { code: "TABLE_NOT_OPEN", message: "Цей стіл зараз не відкритий" } },
      { status: 404 },
    );
  }

  try {
    const tableSession = await prisma.tableSession.create({
      data: {
        tableCode,
        userId: session.user.id,
        posTableExternalId: tableStatus.posTableExternalId,
      },
    });
    return NextResponse.json({ id: tableSession.id, status: tableSession.status }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Частичный уникальный индекс на активную сессию стола (raw SQL, не выражается в Prisma) —
      // Prisma всё равно определяет нарушение как P2002 по коду ошибки Postgres (23505).
      return NextResponse.json(
        { error: { code: "ALREADY_LINKED", message: "Цей стіл уже очікує підтвердження або зайнятий" } },
        { status: 409 },
      );
    }
    throw error;
  }
}

// Текущий статус привязки гостя к столу (нет / ожидает / подтверждена / отклонена).
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const tableSession = await prisma.tableSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });

  if (!tableSession) return NextResponse.json({ status: "NONE" });

  return NextResponse.json({
    id: tableSession.id,
    tableCode: tableSession.tableCode,
    status: tableSession.status,
    requestedAt: tableSession.requestedAt,
    confirmedAt: tableSession.confirmedAt,
  });
}
