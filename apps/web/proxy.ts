import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { apiAuthPrefix, authRoutes, PublicRoutes } from "./routes";

import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  const isPublicRoute = PublicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = Boolean(session?.user);

  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL("/auth/login", request.url);

    loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);

    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/editor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
