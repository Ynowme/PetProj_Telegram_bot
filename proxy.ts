import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// FR-006: неавторизованный доступ к личному кабинету -> редирект на /login.
// /admin/*: доступ только пользователям с isAdmin (см. spec.md → «Административный инструмент»).
export default auth((request) => {
  if (!request.auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !request.auth.user?.isAdmin) {
    return NextResponse.redirect(new URL("/account", request.url));
  }
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
