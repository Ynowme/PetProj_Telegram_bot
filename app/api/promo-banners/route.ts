import { NextResponse } from "next/server";
import { getActivePromoBanners } from "@/lib/promo-banners";

// FR-008: активные баннеры карусели, по порядку.
export async function GET() {
  const banners = await getActivePromoBanners();

  return NextResponse.json({ banners });
}
