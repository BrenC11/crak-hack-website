import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "crakhack_screener";

function isScreenerHost(host: string | null) {
  const normalized = (host ?? "").split(":")[0]?.toLowerCase();
  // Accept both spellings just in case DNS/certs differ.
  return (
    normalized === "screener.crakhack.com" || normalized === "screener.crackhack.com"
  );
}

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".png")
  );
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const host = request.headers.get("host");

  // 1. Always allow public assets
  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. Screener subdomain root should be protected too.
  if (isScreenerHost(host) && pathname === "/") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token !== "ok") {
      url.pathname = "/crakhackscreener666/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.rewrite(url);
    }

    url.pathname = "/crakhackscreener666";
    return NextResponse.rewrite(url);
  }

  // 3. Only protect the screener paths
  if (!pathname.startsWith("/crakhackscreener666")) {
    return NextResponse.next();
  }

  // 4. Allow login/auth routes
  if (
    pathname.startsWith("/crakhackscreener666/login") ||
    pathname.startsWith("/crakhackscreener666/auth")
  ) {
    return NextResponse.next();
  }

  // 5. Enforce auth
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token === "ok") {
    return NextResponse.next();
  }

  // 6. Redirect to login
  url.pathname = "/crakhackscreener666/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/:path*"],
};