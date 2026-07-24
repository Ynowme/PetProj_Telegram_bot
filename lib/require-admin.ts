import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Повертає сесію залогіненого гостя або готову 401-відповідь, якщо доступу немає. */
export async function requireUser() {
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
  return { session, response: null } as const;
}

/** Повертає сесію адміністратора або готову 401/403-відповідь, якщо доступу немає. */
export async function requireAdmin() {
  const { session, response } = await requireUser();
  if (response) return { session: null, response } as const;
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
