import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AuthConfigurationError,
  isSessionTokenValid,
} from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let authenticated = false;

  try {
    authenticated = isSessionTokenValid(
      request.cookies.get(AUTH_COOKIE_NAME)?.value,
    );
  } catch (error) {
    if (!(error instanceof AuthConfigurationError)) throw error;
  }

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/paddleocr", request.url));
  }
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
