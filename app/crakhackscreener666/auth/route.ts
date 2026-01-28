import { NextResponse } from "next/server";

const COOKIE_NAME = "crakhack_screener";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/crakhackscreener666");
  const expected = process.env.SCREENER_PASSWORD ?? "";

  if (!expected || password !== expected) {
    const url = new URL("/crakhackscreener666/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const url = new URL(nextPath, request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set(COOKIE_NAME, "ok", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
