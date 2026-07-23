import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/request-security";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
  { status: 401 },
);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return UNAUTHORIZED;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Користувача не знайдено" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
}

// FR-024: редактирование профиля (имя/email/телефон).
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return UNAUTHORIZED;

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Користувача не знайдено" } },
      { status: 404 },
    );
  }

  const email = body.email ? normalizeEmail(body.email) : undefined;
  const phone = body.phone ? normalizePhone(body.phone) : undefined;
  if (body.phone && !phone) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Вкажіть телефон у форматі +380XXXXXXXXX" } },
      { status: 400 },
    );
  }

  if (email || phone) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: user.id },
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: { code: "USER_EXISTS", message: "Користувач вже зареєстрований" } },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
  });
}
