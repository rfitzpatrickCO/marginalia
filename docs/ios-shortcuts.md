# iOS Shortcuts

Marginalia exposes a small token-authenticated API so you can capture books,
reading sessions, and quotes from your phone — no need to open the web app.
This guide covers the three endpoints and how to wire each one up as an iOS
Shortcut.

## Before you start

You need two things:

1. **Your app's base URL** — e.g. `https://your-app.vercel.app`. Shortcuts run
   on your phone, so this must be a deployed URL, not `localhost`.
2. **Your personal API token** — open the web app, go to **Settings → Account →
   iOS Shortcuts token**, and tap to generate one. It's shown once, so copy it
   right away. The token is tied to *your* account, so anything you post lands in
   your library (not anyone else's). Treat it like a password; tap again anytime
   to regenerate (which invalidates the old one).

Every request must include the header:

```
Authorization: Bearer <YOUR_TOKEN>
```

A missing or wrong token returns **401**. Throughout this doc, replace
`YOUR-APP` and `YOUR_TOKEN` with your own values.

---

## Endpoints at a glance

| Endpoint | Purpose | Required | Optional |
| --- | --- | --- | --- |
| `POST /api/books` | Add a book | `title`, `author` | `status`, `pageCount`, `format`, `series`, `seriesNumber` |
| `POST /api/sessions` | Log reading progress | `bookId` **or** `title` | `toPage`, `fromPage`, `date` |
| `POST /api/quotes` | Save a quote | (`bookId` **or** `title`), `text` | `page` |

All three return **201** with the created record on success. Books and quotes
identify the target book by `bookId` (a UUID) **or** an exact, case-insensitive
`title` — `title` is usually easiest from a Shortcut.

Common responses: `400` (bad/missing fields), `401` (bad token), `404` (book
not found, for sessions/quotes), `503` (database not configured).

---

## 1. Add a book

`POST /api/books`

```json
{
  "title": "Project Hail Mary",
  "author": "Andy Weir",
  "status": "toread",
  "pageCount": 496,
  "format": "hardcover"
}
```

- `status`: `reading` · `toread` · `finished` (default `toread`)
- `format`: `hardcover` · `paperback` · `ebook` · `audiobook` (default `hardcover`)
- `status: "reading"` sets the start date; `status: "finished"` sets the finish
  date and marks it fully read (so it counts in your Stats). Same behavior as
  adding a book in the web app.

**Shortcut steps**

1. **Ask for Input** → "Book title" (Text). 
2. **Ask for Input** → "Author" (Text).
3. **Get Contents of URL**
   - URL: `https://YOUR-APP/api/books`
   - Method: **POST**
   - Headers: `Authorization` = `Bearer YOUR_TOKEN`
   - Request Body: **JSON**
     - `title` (Text) → *Provided Input* from step 1
     - `author` (Text) → *Provided Input* from step 2
     - `status` (Text) → `toread`
4. *(optional)* **Show Notification** → "Added [title]".

---

## 2. Log a reading session

`POST /api/sessions`

```json
{
  "title": "Project Hail Mary",
  "toPage": 142
}
```

- Identify the book with `title` (or `bookId`).
- `toPage` is the page you've now reached. `fromPage` defaults to the book's
  current page, so **sending just `toPage` works** — it records the pages since
  last time.
- `date` is an optional ISO timestamp (defaults to now).
- Side effects: advances the book's progress (never backwards) and flips a
  "to read" book to "reading". This is what feeds the Stats heatmap.

**Shortcut steps**

1. **Ask for Input** → "Book title" (Text).
2. **Ask for Input** → "Current page" (Number).
3. **Get Contents of URL**
   - URL: `https://YOUR-APP/api/sessions`
   - Method: **POST**
   - Headers: `Authorization` = `Bearer YOUR_TOKEN`
   - Request Body: **JSON**
     - `title` (Text) → *Provided Input* from step 1
     - `toPage` (Number) → *Provided Input* from step 2

> Tip: keep a per-book Shortcut for whatever you're currently reading by
> hard-coding `title`, so logging is a single tap that only asks for the page.

---

## 3. Save a quote

`POST /api/quotes`

```json
{
  "title": "Project Hail Mary",
  "text": "I penetrated the outer cell membrane with a nanosyringe.",
  "page": 96
}
```

- Identify the book with `title` (or `bookId`).
- `text` is required; `page` is optional.

**Shortcut steps (Share Sheet capture)**

This works great as a Share Sheet action: highlight text in any app → Share →
your Shortcut.

1. In the Shortcut settings, enable **Show in Share Sheet** and accept **Text**.
2. **Receive Text input** from the Share Sheet (the shortcut's input).
3. **Ask for Input** → "Which book?" (Text). *(Or hard-code your current read.)*
4. *(optional)* **Ask for Input** → "Page" (Number).
5. **Get Contents of URL**
   - URL: `https://YOUR-APP/api/quotes`
   - Method: **POST**
   - Headers: `Authorization` = `Bearer YOUR_TOKEN`
   - Request Body: **JSON**
     - `title` (Text) → step 3
     - `text` (Text) → *Shortcut Input* from step 2
     - `page` (Number) → step 4

---

## Testing from a terminal

Before building the Shortcut, you can confirm the endpoint works with `curl`:

```bash
curl -X POST https://YOUR-APP/api/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Project Hail Mary","text":"Rocky is the best.","page":210}'
```

A `201` with a JSON body means you're ready to build the Shortcut.

## Notes

- **Keeping the token safe:** the simplest approach is a **Text** action at the
  top of each Shortcut holding the token, referenced by the request header.
  Anyone with the token can write to your library, so don't share the Shortcut
  with the token embedded. Lost it or shared it by accident? Regenerate it from
  Settings → Account.
- **Title matching** is exact (case-insensitive). If a session or quote returns
  `404`, check the title matches the book in your library, or pass `bookId`.
- These endpoints only **write**. There's no read API; browse your library in
  the web app.
