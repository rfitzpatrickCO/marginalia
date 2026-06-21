# Marginalia

A quiet, private book tracker with an iOS-style interface — track what you're
reading, log progress, save quotes, and watch your reading habit build on an
activity heatmap. It's a Progressive Web App you can install to your home
screen, with a per-user iOS Shortcuts API. Accounts are **invite-only**: the
owner invites people by email, and each person gets their own private library.

## Features

- **Accounts** — email + password, invite-only. The owner invites by email from
  Settings; new users get an onboarding flow with optional Goodreads import. Each
  user's library, stats, and tokens are fully isolated.
- **Home dashboard** — your current books plus this month's stats.
- **Library shelves** — Reading, Read (grouped by year), and Want to Read, with
  search. A responsive layout: phone column on mobile, sidebar + grids on desktop.
- **Add & edit books** with a built-in metadata lookup (Google Books, falling
  back to Open Library) that fills in author, page count, genres, and cover art.
- **Generated covers** with a real-cover overlay — covers never break — plus a
  "sync covers" action to refresh art across the library.
- **Reading progress** — log sessions or one-tap "mark as read"; shelves update
  automatically.
- **Quotes** — capture, edit, and delete quotes per book.
- **Stats** — books and pages read this year, current and longest streaks, and a
  GitHub-style activity heatmap.
- **Appearance** — light, dark, or system theme.
- **Import & export** — import a Goodreads CSV; export a Goodreads-compatible CSV
  (works with [Hardcover](https://hardcover.app), too).
- **iOS Shortcuts API** — per-user bearer-token endpoints to add books, log
  sessions, and save quotes from your phone. See
  [docs/ios-shortcuts.md](docs/ios-shortcuts.md).

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) · React 19 · TypeScript
- [Drizzle ORM](https://orm.drizzle.team) on [Neon](https://neon.tech) Postgres,
  via the `@neondatabase/serverless` HTTP driver
- Server Actions and Route Handlers; auth enforced per-page via `requireUser`
  (scrypt password hashing, signed session cookies — all Node runtime)
- No UI framework — a small hand-rolled iOS-style design system in CSS

## Getting started

### Prerequisites

- Node.js 18.18+ (or 20+)
- A Postgres database — a free [Neon](https://neon.tech) project is the easiest.

### Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
```

Apply the schema and load the sample library:

```bash
# These scripts read DATABASE_URL from the environment. Either export it first…
export DATABASE_URL="postgresql://…"   # your Neon pooled connection string
npm run db:migrate
npm run db:seed                        # optional: sample books + reading history
```

Run the dev server, then sign up:

```bash
npm run dev   # http://localhost:3000
```

Go to `/signup` and register with the email you set as `OWNER_EMAIL` — that
first owner sign-up adopts any books seeded above. Invite others from
**Settings → Invites**; they sign up at `/signup` with the invited email.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon **pooled** connection string. Without it the app falls back to read-only sample data. |
| `AUTH_SECRET` | Yes | Signs session cookies. Generate with `openssl rand -base64 32`. |
| `OWNER_EMAIL` | Yes | The account that can sign up without an invite and send invites. Adopts the existing library on first sign-up. |
| `GOOGLE_BOOKS_API_KEY` | No | Lifts Google Books' per-IP rate limit during metadata lookup. The lookup still works without it (falls back to Open Library). |

The per-user iOS Shortcuts token is generated in-app (Settings → Account), not
via env. `.env.local` is gitignored — secrets never land in the repo.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | Lint |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push the schema directly (dev convenience) |
| `npm run db:seed` | Seed sample books, quotes, and reading sessions (idempotent) |

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
   The Next.js framework preset is detected automatically.
3. Add the environment variables (`DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`,
   and optionally `GOOGLE_BOOKS_API_KEY`) under **Project → Settings →
   Environment Variables**.
4. Deploy. Use your Neon **pooled** connection string for `DATABASE_URL` — the
   serverless HTTP driver is built for this environment.
5. Make sure migrations have been applied to the production database
   (`npm run db:migrate` against the production `DATABASE_URL`). If you reuse the
   same Neon database you migrated locally, the schema is already in place.
6. Visit `/signup` and register with `OWNER_EMAIL` to claim the owner account,
   then invite people from Settings. Your deployed URL is the base for iOS
   Shortcuts — see [docs/ios-shortcuts.md](docs/ios-shortcuts.md).

## Project structure

```
app/            Routes (App Router): home, library, book/[id], stats, settings,
                login, signup, onboarding, export, and the /api/* endpoints
components/      UI components (Sidebar, LibraryView, Cover, sheets, Heatmap, …)
lib/            db (Drizzle schema + client), auth (passwords/sessions/owner),
                book-search, goodreads, export, stats, sample data
drizzle/        Committed SQL migrations
docs/           iOS Shortcuts guide, multi-user plan
```

## License

Personal project — no license granted for reuse.
