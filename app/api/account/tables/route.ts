import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { posProvider } from "@/lib/pos";

// Реєстр столів для бронювання (доступно лише Gold Member, як і самі послуги).
export async function GET() {
  const { session, response } = await requireUser();
  if (response) return response;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "GOLD_MEMBER") {
    return NextResponse.json(
      { error: { code: "NOT_GOLD_MEMBER", message: "Послуги доступні лише Gold Member" } },
      { status: 403 },
    );
  }

  const tables = await posProvider.listTables();
  return NextResponse.json(tables);
}
