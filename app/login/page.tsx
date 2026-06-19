import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="login">
      <form className="login-card" action={login}>
        <div className="login-mark">Marginalia</div>
        <p className="login-sub">Enter your password to continue.</p>
        <input type="hidden" name="next" value={next ?? "/library"} />
        <input
          className="login-input"
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          aria-label="Password"
        />
        {error ? <p className="login-error">Incorrect password.</p> : null}
        <button className="login-btn" type="submit">
          Unlock
        </button>
      </form>
    </main>
  );
}
