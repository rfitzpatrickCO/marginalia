import { NextResponse, type NextRequest } from "next/server";
import { hmacSha256Hex } from "./lib/edge-hmac";

/*
 * Self-contained on purpose: middleware runs on the Edge runtime, so it must not
 * share a module with the Node-runtime route handlers/server actions, and it
 * avoids Web Crypto (`crypto.subtle`) entirely — referencing it makes Vercel's
 * Edge bundler inject a crypto shim that fails to initialize on the real Edge
 * runtime (MIDDLEWARE_INVOCATION_FAILED). The pure-JS HMAC in lib/edge-hmac.ts
 * produces output identical to `sessionToken()` in lib/auth.ts, so cookies set
 * at login validate here.
 */

const SESSION_COOKIE = "marginalia_session";

/** Constant-time comparison so we don't leak via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;

  // No password configured → leave the app open (dev / pre-setup).
  if (!password) return NextResponse.next();

  try {
    const cookie = req.cookies.get(SESSION_COOKIE)?.value;
    const expected = hmacSha256Hex(password, "marginalia-session-v1");
    if (cookie && safeEqual(cookie, expected)) return NextResponse.next();
  } catch (err) {
    // Fail closed (fall through to the login redirect) rather than 500.
    console.error("middleware auth check failed:", err);
  }

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
