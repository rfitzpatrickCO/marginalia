/**
 * Multi-user auth (self-contained, email + password).
 *
 *  - Web: email + password → an httpOnly session cookie carrying the user id,
 *    signed with AUTH_SECRET so it can't be forged. Pages call requireUser().
 *  - iOS Shortcuts / API: a per-user bearer token (users.api_token).
 *  - The "owner" (OWNER_EMAIL) can sign up without an invite and send invites.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";

export type User = typeof users.$inferSelect;

const SESSION_COOKIE = "marginalia_session";

function authSecret(): string {
  // AUTH_SECRET is required in production; fall back only for local dev.
  return process.env.AUTH_SECRET || process.env.APP_PASSWORD || "marginalia-dev-secret";
}

// ---------- passwords (scrypt) ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---------- sessions ----------

function sign(userId: string): string {
  return createHmac("sha256", authSecret()).update(userId).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

async function sessionUserId(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const userId = value.slice(0, dot);
  const sig = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  return userId;
}

// ---------- current user ----------

/** The signed-in user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  if (!db) return null;
  const id = await sessionUserId();
  if (!id) return null;
  return (await db.query.users.findFirst({ where: eq(users.id, id) })) ?? null;
}

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** True for the single owner account (set via OWNER_EMAIL). */
export function isOwner(user: Pick<User, "email">): boolean {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner) && user.email.toLowerCase() === owner;
}

/** Resolve a request's `Authorization: Bearer <token>` to its owning user. */
export async function userFromBearer(req: Request): Promise<User | null> {
  if (!db) return null;
  const header = req.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return null;
  const token = header.slice(prefix.length).trim();
  if (!token) return null;
  return (await db.query.users.findFirst({ where: eq(users.apiToken, token) })) ?? null;
}
