import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = /^\/(en|de)\/members(\/.*)?$/;
const JWT_SECRET_KEY = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret-change-me");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PROTECTED_PATHS.test(pathname)) {
    const sessionCookie = request.cookies.get("session");

    if (!sessionCookie?.value) {
      const locale = pathname.split("/")[1] || "en";
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(sessionCookie.value, JWT_SECRET_KEY());
    } catch {
      const locale = pathname.split("/")[1] || "en";
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set("session", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};
