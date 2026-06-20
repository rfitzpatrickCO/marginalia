"use server";

import { redirect } from "next/navigation";
import { eq, isNull } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/db";
import { books, invites, users } from "@/lib/db/schema";
import {
  clearSession,
  createSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export type AuthState = { error?: string };

function ownerEmail(): string | null {
  return process.env.OWNER_EMAIL?.trim().toLowerCase() || null;
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!hasDatabase || !db) return { error: "Database not configured." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect("/home");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!hasDatabase || !db) return { error: "Database not configured." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // Invite gate: the owner is always allowed; everyone else needs an invite.
  const isOwnerSignup = email === ownerEmail();
  if (!isOwnerSignup) {
    const invite = await db.query.invites.findFirst({
      where: eq(invites.email, email),
    });
    if (!invite) {
      return { error: "This email hasn't been invited. Ask the owner for an invite." };
    }
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: "An account with this email already exists — try logging in." };
  }

  const [user] = await db
    .insert(users)
    .values({ email, name: name || null, passwordHash: hashPassword(password) })
    .returning();

  // First owner sign-up adopts the pre-multi-user library (orphan books).
  if (isOwnerSignup) {
    await db.update(books).set({ userId: user.id }).where(isNull(books.userId));
  }

  await createSession(user.id);
  redirect("/onboarding");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
