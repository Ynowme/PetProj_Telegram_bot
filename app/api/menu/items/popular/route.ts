import { NextResponse } from "next/server";
import { getPopularMenuItems, serializeMenuItem } from "@/lib/menu";

// FR-021: топ-10 позиций, отсортированных по количеству лайков.
export async function GET() {
  const items = await getPopularMenuItems();

  return NextResponse.json({ items: items.map(serializeMenuItem) });
}
