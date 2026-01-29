import { NextResponse } from "next/server";

const COOKIE_NAME = "crakhack_screener";

export async function GET(request: Request) {
  // If someone navigates here directly, send them to the login page
  // instead of showing a 405 Method Not Allowed.
  const url = new URL("/screener/login", request.url);
  url.searchParams.set("next", "/screener");
  return NextResponse.redirect(url, 302);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/screener");
  const expected = process.env.SCREENER_PASSWORD ?? "";

  if (!expected || password !== expected) {
    const url = new URL("/screener/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    // 303 ensures the browser follows with a GET (not another POST).
    return NextResponse.redirect(url, 303);
  }

  const url = new URL(nextPath, request.url);
  // 303 ensures the browser follows with a GET.
  const response = NextResponse.redirect(url, 303);
  response.cookies.set(COOKIE_NAME, "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

