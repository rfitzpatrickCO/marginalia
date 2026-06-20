"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, hasDatabase } from "@/lib/db";
import { books, invites, users } from "@/lib/db/schema";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { parseGoodreadsCsv } from "@/lib/goodreads";

export type ImportState = {
  ok: boolean;
  imported?: number;
  skipped?: number;
  error?: string;
};

/** Import a Goodreads library-export CSV. Skips books already in the library
 *  (matched by ISBN, else title + author). */
export async function importGoodreads(csvText: string): Promise<ImportState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = parseGoodreadsCsv(csvText);
  if (parsed.length === 0) {
    return {
      ok: false,
      error: "No books found — is this a Goodreads library export CSV?",
    };
  }

  const existing = await db.query.books.findMany({
    where: eq(books.userId, user.id),
    columns: { title: true, author: true, isbn: true },
  });
  const seenIsbn = new Set(
    existing.map((e) => e.isbn).filter((v): v is string => Boolean(v)),
  );
  const key = (t: string, a: string) => `${t.toLowerCase()}|${a.toLowerCase()}`;
  const seenKey = new Set(existing.map((e) => key(e.title, e.author)));

  const toInsert = parsed
    .filter((b) => {
      if (b.isbn && seenIsbn.has(b.isbn)) return false;
      return !seenKey.has(key(b.title, b.author));
    })
    .map((b) => ({ ...b, userId: user.id }));

  // Insert in chunks to keep the statement's parameter count reasonable.
  for (let i = 0; i < toInsert.length; i += 100) {
    await db.insert(books).values(toInsert.slice(i, i + 100));
  }

  if (toInsert.length > 0) {
    revalidatePath("/home");
    revalidatePath("/library");
    revalidatePath("/stats");
  }
  return {
    ok: true,
    imported: toInsert.length,
    skipped: parsed.length - toInsert.length,
  };
}

export type SyncCoversState = {
  ok: boolean;
  updated?: number;
  checked?: number;
  error?: string;
};

/** Fetch a Google Books cover image for a book (its CDN loads reliably in bulk,
 *  unlike Open Library which rate-limits when the library page loads many at
 *  once). Returns a usable https URL or null. */
async function googleCover(
  isbn: string | null,
  title: string,
  author: string,
): Promise<string | null> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const q = isbn
    ? `isbn:${isbn}`
    : `intitle:${title}${author ? ` inauthor:${author}` : ""}`;
  const url =
    "https://www.googleapis.com/books/v1/volumes?maxResults=1&q=" +
    encodeURIComponent(q) +
    (key ? `&key=${key}` : "");
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: { volumeInfo?: { imageLinks?: { thumbnail?: string } } }[];
    };
    const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    return thumb
      ? thumb.replace(/^http:/, "https:").replace(/&edge=curl/, "")
      : null;
  } catch {
    return null;
  }
}

/** Re-fetch cover art for every book from Google Books and store it, replacing
 *  flaky Open Library URLs. Bounded concurrency to stay within the function
 *  time limit. */
export async function syncCovers(): Promise<SyncCoversState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const all = await db.query.books.findMany({
    where: eq(books.userId, user.id),
    columns: { id: true, title: true, author: true, isbn: true, coverUrl: true },
  });

  const queue = [...all];
  let updated = 0;
  async function worker() {
    while (queue.length) {
      const b = queue.shift();
      if (!b) break;
      const cover = await googleCover(b.isbn, b.title, b.author);
      if (cover && cover !== b.coverUrl) {
        await db!.update(books).set({ coverUrl: cover }).where(eq(books.id, b.id));
        updated++;
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  revalidatePath("/");
  revalidatePath("/library");
  return { ok: true, updated, checked: all.length };
}

// ---------- invites (owner only) ----------

export type InviteState = { ok: boolean; error?: string };

export async function inviteEmail(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };
  const user = await getCurrentUser();
  if (!user || !isOwner(user)) return { ok: false, error: "Not allowed." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  await db.insert(invites).values({ email }).onConflictDoNothing();
  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeInvite(formData: FormData): Promise<void> {
  if (!hasDatabase || !db) return;
  const user = await getCurrentUser();
  if (!user || !isOwner(user)) return;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) await db.delete(invites).where(eq(invites.email, email));
  revalidatePath("/settings");
}

// ---------- per-user iOS API token ----------

export async function generateApiToken(): Promise<
  { ok: true; token: string } | { ok: false; error: string }
> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const token = randomBytes(24).toString("base64url");
  await db.update(users).set({ apiToken: token }).where(eq(users.id, user.id));
  revalidatePath("/settings");
  return { ok: true, token };
}
