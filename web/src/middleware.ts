import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // If no token configured, allow everything (local dev)
  if (!process.env.INTERNAL_ACCESS_TOKEN) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get("auth")?.value;
  if (authCookie === process.env.INTERNAL_ACCESS_TOKEN || authCookie === "open") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
