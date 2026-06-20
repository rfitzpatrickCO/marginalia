"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/login/actions";

const initial: AuthState = {};

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, initial);

  return (
    <main className="login">
      <form className="login-card" action={action}>
        <div className="login-mark">Marginalia</div>
        <p className="login-sub">Create your account.</p>
        <input
          className="login-input"
          name="name"
          placeholder="Name"
          autoComplete="name"
          autoFocus
          aria-label="Name"
        />
        <input
          className="login-input"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          aria-label="Email"
        />
        <input
          className="login-input"
          type="password"
          name="password"
          placeholder="Password (8+ characters)"
          autoComplete="new-password"
          aria-label="Password"
        />
        {state.error ? <p className="login-error">{state.error}</p> : null}
        <button className="login-btn" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="login-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
