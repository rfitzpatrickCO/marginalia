# Multi-user plan

Turning Marginalia from a single-user app into one you can share with friends and
family. This is the largest change to date — it touches auth, the schema, and
every read/write path — so this doc lays out the approach, the decisions you need
to make, and a phased migration so it can ship safely.

## Where we are today (single-user)

- **Auth:** one shared `APP_PASSWORD` → an HMAC session cookie, enforced by
  `requireAuth()` in each protected page (`lib/auth.ts`). One global `API_TOKEN`
  bearer for the iOS Shortcuts API.
- **Schema (`lib/db/schema.ts`):** `books`, `quotes`, `reading_sessions`,
  `genres`. **No concept of an owner** — every row is implicitly "yours."
- **Data access:** `lib/books.ts` (`getBooks`, `getBook`), `lib/stats.ts`
  (`getStats`), server actions in `app/library/actions.ts` and
  `app/book/[id]/actions.ts`, `app/settings/actions.ts` (`importGoodreads`), the
  `app/api/*` routes, and `app/export/route.ts`. None of these filter by user.

The core work is: **add a `users` concept, attach every book to a user, and scope
every query and mutation to the signed-in user.**

---

## Recommended stack & key decisions

| Decision | Recommendation | Why |
| --- | --- | --- |
| Auth library | **Auth.js v5** (`next-auth@beta`) + `@auth/drizzle-adapter` | First-class Next App Router support, free, self-hosted, integrates with our Neon/Drizzle setup. |
| Sign-in method | **Google OAuth** | No passwords to store or reset; everyone has a Google account. (Email magic-links are a good fallback.) |
| Sign-up policy | **Invite-only (email allowlist)** | Friends & family, not the public — prevents random signups. |
| Existing data | **Backfill to your account** | Keep your library; don't start from scratch. |
| iOS API auth | **Per-user tokens** | The single global `API_TOKEN` can't tell users apart. |
| Session strategy | **Database sessions** (via the Drizzle adapter) | Simplest with the adapter; works with the Neon HTTP driver. |

These are defaults — the "Open decisions" checklist at the end is where you
confirm or change them.

---

## 1. Schema changes

Add a users layer and an owner column. Auth.js's Drizzle adapter expects four
tables (`users`, `accounts`, `sessions`, `verificationTokens`) — we add those,
plus an owner reference on `books`.

```ts
// new — Auth.js adapter tables (users, accounts, sessions, verificationTokens)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  apiToken: text("api_token").unique(),      // per-user iOS Shortcuts token
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
// accounts / sessions / verificationTokens: standard Auth.js shape

// changed — books gains an owner
export const books = pgTable("books", {
  // ...existing columns...
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});
```

**`quotes` and `reading_sessions` don't need their own `userId`** — they already
cascade from `books` via `bookId`, and they're always reached through a book. So
scoping `books` by user scopes everything transitively. (`genres` is effectively
unused today; leave it global or drop it.)

A note on the owner backfill: add `userId` as **nullable first**, backfill the
existing rows to your user, then flip it to `NOT NULL` (see migration phases).

---

## 2. Auth integration (Auth.js v5)

1. `npm i next-auth@beta @auth/drizzle-adapter`.
2. **Google OAuth credentials:** create an OAuth client in Google Cloud Console;
   set the authorized redirect URI to `https://<your-app>/api/auth/callback/google`.
3. `auth.ts` at the project root configures providers + the Drizzle adapter and a
   `signIn` callback that enforces the invite allowlist:

   ```ts
   callbacks: {
     async signIn({ user }) {
       const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",");
       return !!user.email && allowed.includes(user.email.toLowerCase());
     },
   }
   ```
4. `app/api/auth/[...nextauth]/route.ts` exposes the Auth.js handlers.
5. **Replace `requireAuth()`** with a session-based guard:

   ```ts
   // returns the signed-in user, or redirects to sign-in
   export async function requireUser() {
     const session = await auth();
     if (!session?.user) redirect("/api/auth/signin");
     return session.user; // { id, email, ... }
   }
   ```

   The current `APP_PASSWORD` / `sessionToken` / `checkPassword` machinery and the
   `/login` page are removed.

---

## 3. Scope every read/write by user (the bulk of the work)

Each data function takes (or derives) the current `userId` and filters/sets it.
Concretely:

| File / function | Change |
| --- | --- |
| `lib/books.ts` → `getBooks` | `where eq(books.userId, userId)` |
| `lib/books.ts` → `getBook` | `where and(eq(books.id, id), eq(books.userId, userId))` — returns null if not owned |
| `lib/stats.ts` → `getStats` | pass `userId` through to `getBooks` |
| `app/library/actions.ts` → `createBook` | set `userId` on insert |
| `app/book/[id]/actions.ts` → `updateBook`, `logSession`, `saveQuote`, `deleteQuote` | **ownership check first**: load the book and confirm `book.userId === userId` before mutating; reject otherwise |
| `app/settings/actions.ts` → `importGoodreads` | set `userId` on every inserted book; dedupe within the user's library only |
| `app/export/route.ts` | export only the user's books |
| `app/api/books|sessions|quotes` | resolve user from the bearer token (below), scope the book match to that user |

**The critical invariant:** no code path may read or write a row it doesn't own.
This is a security property, so the ownership checks deserve careful review and a
test that confirms user A can't touch user B's books/quotes/sessions.

---

## 4. Per-user API tokens (iOS Shortcuts)

- Each user gets a random `apiToken` (the `users.api_token` column), generated
  from **Settings → "Generate iOS token"** (and re-generatable to revoke).
- `checkBearer(req)` changes from "compare to one env var" to "look up the token
  and return its user":

  ```ts
  export async function userFromBearer(req: Request): Promise<User | null> {
    const token = bearer(req);
    if (!token) return null;
    return db.query.users.findFirst({ where: eq(users.apiToken, token) }) ?? null;
  }
  ```
- The `app/api/*` routes call this, 401 on null, and scope all work to that user.
- `docs/ios-shortcuts.md` updates: the token now comes from Settings, per person.

---

## 5. Access control & onboarding

- **Invite-only:** `ALLOWED_EMAILS` (comma-separated) checked in the `signIn`
  callback. To add someone, add their email and they can sign in. (A later upgrade
  is a proper `invites` table you manage in-app.)
- **New user:** lands on an **empty library** — the existing empty state already
  says "Your library is empty. Tap + to log your first book." No per-user sample
  seeding (real users want their own data).

---

## 6. Migration plan (phased, ordered)

Each phase is independently deployable, which keeps risk low.

1. **Auth foundation** — add `users`/`accounts`/`sessions`/`verificationTokens`
   tables, install Auth.js, wire Google OAuth + the allowlist, add sign-in/out.
   App still uses `requireAuth` for data; nothing user-scoped yet.
2. **Owner column (nullable)** — add `books.userId` nullable; generate + run the
   migration.
3. **Backfill** — set `userId` on your existing 6 books to your new user row, then
   a follow-up migration flips `userId` to `NOT NULL`.
4. **Scope the data layer** — update every function in §3 to filter/set `userId`;
   switch pages from `requireAuth()` to `requireUser()`.
5. **Per-user API tokens** — add `users.api_token`, the Settings UI to generate
   it, swap `checkBearer` for `userFromBearer`; retire the global `API_TOKEN`.
6. **Polish & ship** — account section in Settings (name/email/avatar, sign out),
   update `README.md` and `docs/ios-shortcuts.md`, add the isolation test.

You can pause after any phase. A natural "soft launch" is after phase 5: invite
one friend and confirm their library is fully separate from yours before opening
it wider.

---

## 7. Effort & risks

- **Effort:** the largest change so far — roughly auth setup (small/medium) +
  schema migration (small) + scoping sweep across ~10 files (medium) + per-user
  tokens (small) + testing (medium). Not exotic, but broad.
- **Main risk — data isolation.** A missed `userId` filter leaks one person's
  library into another's. Mitigation: centralize scoping (always go through
  `getBooks(userId)` / ownership-checked mutations), and add an automated test
  that asserts cross-user access fails.
- **Secondary — OAuth setup friction.** Google Cloud OAuth config + redirect URIs
  + `AUTH_SECRET` need to be right in Vercel. One-time setup.
- **Reversibility.** Phases 1–3 are additive and safe; phase 4 is the point of no
  easy return (queries become user-scoped). Take a Neon branch/backup before it.

---

## 8. New environment variables

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Auth.js session/JWT signing (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | Your deployed URL (e.g. `https://<app>.vercel.app`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `ALLOWED_EMAILS` | Comma-separated invite allowlist |

`APP_PASSWORD` and the global `API_TOKEN` are **retired** once phases 4–5 land.

---

## 9. Open decisions (confirm before we start)

1. **Sign-in:** Google OAuth (recommended) — or add email magic-links / email+password?
2. **Sign-up:** invite-only allowlist (recommended) — or open to anyone?
3. **Existing data:** backfill your 6 books to your account (recommended) — or start fresh?
4. **Scope creep:** keep it to "shared private libraries," or also want any social
   features later (shared shelves, following, public profiles)? That would expand
   the schema and is worth flagging now even if deferred.

Once these are settled, phase 1 (auth foundation) is the place to start.
