import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return;
}

export const config = {
  matcher: "/about/:path*",
};
