/**
 * Single-user auth. Two independent mechanisms:
 *
 *  - Web UI: a password (`APP_PASSWORD`) exchanged at /login for an httpOnly
 *    session cookie. The cookie value is an HMAC keyed by the password, so it
 *    can't be forged and changing the password invalidates old sessions.
 *  - iOS Shortcuts / API: a bearer token (`API_TOKEN`) sent as
 *    `Authorization: Bearer <token>` on /api/* requests.
 *
 * Uses only Web Crypto + standard APIs so it runs in the edge middleware as
 * well as Node route handlers and server actions.
 */

export const SESSION_COOKIE = "marginalia_session";

/** True when web-login is configured. When false the app is left open, mirroring
 *  the sample-data fallback so the UI is usable before secrets are wired up. */
export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

/** Constant-time string comparison to avoid leaking length/content via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The expected session-cookie value for the current password. */
export function sessionToken(): Promise<string> {
  return hmacHex(process.env.APP_PASSWORD ?? "", "marginalia-session-v1");
}

/** True when the cookie value matches the current password's session token. */
export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value || !authEnabled()) return false;
  return safeEqual(value, await sessionToken());
}

/** True when the submitted login password matches `APP_PASSWORD`. */
export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "";
  return expected.length > 0 && safeEqual(input, expected);
}

/** Validate `Authorization: Bearer <API_TOKEN>` on an incoming API request. */
export function checkBearer(req: Request): boolean {
  const expected = process.env.API_TOKEN ?? "";
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  return safeEqual(header.slice(prefix.length).trim(), expected);
}
