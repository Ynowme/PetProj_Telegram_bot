import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-content";

// FR-012…FR-014, FR-022, FR-023: контакты, адрес, часы, «о нас», дисклеймер об аллергии.
export async function GET() {
  const siteContent = await getSiteContent();
  return NextResponse.json(siteContent);
}
