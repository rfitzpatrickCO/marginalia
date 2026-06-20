import { requireUser, isOwner } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoodreadsImport } from "@/components/GoodreadsImport";
import { SyncCovers } from "@/components/SyncCovers";
import { InviteManager } from "@/components/InviteManager";
import { ApiTokenRow } from "@/components/ApiTokenRow";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const owner = isOwner(user);

  let inviteList: { email: string; joined: boolean }[] = [];
  if (owner && db) {
    const [invs, members] = await Promise.all([
      db.query.invites.findMany(),
      db.query.users.findMany({ columns: { email: true } }),
    ]);
    const memberSet = new Set(members.map((m) => m.email.toLowerCase()));
    inviteList = invs
      .map((i) => ({ email: i.email, joined: memberSet.has(i.email.toLowerCase()) }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }

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
      <div className="group spaced">
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
      <SyncCovers />

      {owner && (
        <>
          <div className="section-header">Invites</div>
          <InviteManager invites={inviteList} />
          <div className="section-footer">
            Invited people can create an account with that email.
          </div>
        </>
      )}

      <div className="section-header">Account</div>
      <div className="group">
        <div className="row">
          <span className="row-label">
            <span className="row-title">{user.name ?? user.email}</span>
            <span className="row-sub">
              {user.email}
              {owner ? " · Owner" : ""}
            </span>
          </span>
        </div>
      </div>
      <ApiTokenRow hasToken={Boolean(user.apiToken)} />
      <form action={logout}>
        <div className="group spaced">
          <button type="submit" className="row" style={{ color: "var(--red)" }}>
            <span className="row-label row-title">Log out</span>
          </button>
        </div>
      </form>
    </main>
  );
}
