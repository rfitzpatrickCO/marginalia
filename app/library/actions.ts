"use server";

import { revalidatePath } from "next/cache";
import { db, hasDatabase } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { searchBooks as searchBooksApi, type BookSearchResult } from "@/lib/book-search";

const STATUSES = ["reading", "toread", "finished"] as const;
const FORMATS = ["hardcover", "paperback", "ebook", "audiobook"] as const;

export type CreateBookState = { ok: boolean; error?: string };

/** Look up book metadata (Google Books + Open Library covers) for the add flow. */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  return searchBooksApi(query);
}

function parseGenres(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Add a book to the library from the web. Mirrors POST /api/books, but is
 *  invoked as a form action (the session cookie gates access via middleware). */
export async function createBook(
  _prev: CreateBookState,
  formData: FormData,
): Promise<CreateBookState> {
  if (!hasDatabase || !db) {
    return { ok: false, error: "Database not configured." };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  if (!title || !author) {
    return { ok: false, error: "Title and author are required." };
  }

  const rawStatus = String(formData.get("status") ?? "");
  const status = STATUSES.includes(rawStatus as never)
    ? (rawStatus as (typeof STATUSES)[number])
    : "toread";
  const rawFormat = String(formData.get("format") ?? "");
  const format = FORMATS.includes(rawFormat as never)
    ? (rawFormat as (typeof FORMATS)[number])
    : "hardcover";
  const pageCount = Math.max(0, Math.trunc(Number(formData.get("pageCount")) || 0));
  const genres = parseGenres(formData.get("genres"));
  const isbn = String(formData.get("isbn") ?? "").trim() || null;
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;

  const now = new Date();
  await db.insert(books).values({
    userId: user.id,
    title,
    author,
    status,
    format,
    pageCount,
    genres,
    isbn,
    coverUrl,
    // Sensible side-effects so the book lands in the right shelf with dates set.
    ...(status === "reading" ? { startDate: now } : {}),
    ...(status === "finished"
      ? { finishDate: now, currentPage: pageCount }
      : {}),
  });

  revalidatePath("/library");
  return { ok: true };
}
