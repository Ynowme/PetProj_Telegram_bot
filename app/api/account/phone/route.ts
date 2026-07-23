import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/request-security";

// FR-026: Telegram-пользователь без телефона указывает его отдельным шагом.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { phone?: string };
  const phone = body.phone ? normalizePhone(body.phone) : null;
  if (!phone) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Вкажіть телефон у форматі +380XXXXXXXXX" } },
      { status: 400 },
    );
  }

  const conflict = await prisma.user.findFirst({
    where: { phone, id: { not: session.user.id } },
  });
  if (conflict) {
    return NextResponse.json(
      { error: { code: "USER_EXISTS", message: "Користувач вже зареєстрований" } },
      { status: 409 },
    );
  }

  const user = await prisma.user.update({ where: { id: session.user.id }, data: { phone } });
  return NextResponse.json({ phone: user.phone });
}
