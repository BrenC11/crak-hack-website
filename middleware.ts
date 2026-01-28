import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "crakhack_screener";

function isScreenerHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("screener.crakhack.com");
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");

  const isScreenerPath = pathname.startsWith("/crakhackscreener666");
  const isLoginPath = pathname.startsWith("/crakhackscreener666/login");
  const isAuthPath = pathname.startsWith("/crakhackscreener666/auth");

  if (isScreenerHost(host) && (pathname === "/" || pathname === "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/crakhackscreener666";
    return NextResponse.rewrite(url);
  }

  if (isScreenerHost(host) && !isScreenerPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/crakhackscreener666${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (!isScreenerPath || isLoginPath || isAuthPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token === "ok") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/crakhackscreener666/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/:path*"]
};
