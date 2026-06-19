import { authEnabled, requireAuth } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoodreadsImport } from "@/components/GoodreadsImport";

export default async function SettingsPage() {
  await requireAuth();
  return (
    <main className="scroll">
      <h1 className="large-title">Settings</h1>

      <div className="section-header">Appearance</div>
      <div className="group">
        <div className="row">
          <span className="row-label row-title">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="section-header">Library</div>
      <GoodreadsImport />
      <div className="group">
        <a className="row" href="/export" download>
          <span className="row-label">
            <span className="row-title">Export library</span>
            <span className="row-sub">Download as Goodreads-compatible CSV</span>
          </span>
        </a>
      </div>
      <div className="section-footer">
        Works with Goodreads and Hardcover imports.
      </div>

      {authEnabled() && (
        <>
          <div className="section-header">Account</div>
          <form action={logout}>
            <div className="group">
              <button type="submit" className="row" style={{ color: "var(--red)" }}>
                <span className="row-label row-title">Log out</span>
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
