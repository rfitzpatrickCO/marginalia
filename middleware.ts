import { NextResponse, type NextRequest } from "next/server";

/*
 * Self-contained on purpose: middleware runs on the Edge runtime, so it must not
 * share a module with the Node-runtime route handlers/server actions. Importing
 * `@/lib/auth` (which is also used by Node code) makes Vercel's Edge bundler pull
 * in a Node `crypto` shim and fail with "referencing unsupported modules". The
 * session-cookie format below mirrors `sessionToken()` in lib/auth.ts exactly,
 * so cookies set at login validate here.
 */

const SESSION_COOKIE = "marginalia_session";

/** Constant-time comparison so we don't leak via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Expected session-cookie value for the current password (HMAC, hex). */
async function expectedToken(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.APP_PASSWORD ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode("marginalia-session-v1"),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  // No password configured → leave the app open (dev / pre-setup).
  if (!process.env.APP_PASSWORD) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await expectedToken())) {
    return NextResponse.next();
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
