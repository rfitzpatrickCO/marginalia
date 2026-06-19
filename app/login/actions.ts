"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, sessionToken } from "@/lib/auth";

/** Validate the submitted password and, on success, set the session cookie. */
export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/library");

  if (!checkPassword(password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // a year — single-user, long-lived
  });

  // Only allow same-origin relative paths as the post-login destination.
  redirect(next.startsWith("/") ? next : "/library");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
