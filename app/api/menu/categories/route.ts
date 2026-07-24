import { NextResponse } from "next/server";
import { getMenuCategories } from "@/lib/menu";

// FR-001: двухуровневая структура категорий/подкатегорий.
export async function GET() {
  const categories = await getMenuCategories();

  return NextResponse.json({ categories });
}
