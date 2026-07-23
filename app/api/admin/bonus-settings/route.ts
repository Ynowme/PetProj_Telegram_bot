import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getBonusPercentage, setBonusPercentage } from "@/lib/bonus-settings";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const percentage = await getBonusPercentage();
  return NextResponse.json({ percentage });
}

export async function PATCH(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { percentage } = (await request.json()) as { percentage?: number };
  if (typeof percentage !== "number" || Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Відсоток має бути числом від 0 до 100" } },
      { status: 400 },
    );
  }

  const saved = await setBonusPercentage(percentage);
  return NextResponse.json({ percentage: saved });
}
