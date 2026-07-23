import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FR-001: двухуровневая структура категорий/подкатегорий.
export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ categories });
}
