import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, isValidSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  // No password configured → leave the app open (dev / pre-setup).
  if (!authEnabled()) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(cookie)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Protect every page except the login screen, the bearer-authed API, Next
  // internals, and public static assets.
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg).*)",
  ],
};
