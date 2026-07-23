import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Повертає сесію адміністратора або готову 401/403-відповідь, якщо доступу немає. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Потрібен вхід" } },
        { status: 401 },
      ),
    } as const;
  }
  if (!session.user.isAdmin) {
    return {
      session: null,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Недостатньо прав" } },
        { status: 403 },
      ),
    } as const;
  }
  return { session, response: null } as const;
}
