"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/db";
import { books, quotes, readingSessions } from "@/lib/db/schema";

const STATUSES = ["reading", "toread", "finished"] as const;
const FORMATS = ["hardcover", "paperback", "ebook", "audiobook"] as const;

export type ActionState = { ok: boolean; error?: string };

function parseGenres(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function revalidateBook(id: string) {
  revalidatePath(`/book/${id}`);
  revalidatePath("/library");
  revalidatePath("/stats");
}

/** Edit a book's core fields, status, progress, and rating from the web. */
export async function updateBook(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing book id." };

  const existing = await db.query.books.findFirst({
    where: eq(books.id, id),
  });
  if (!existing) return { ok: false, error: "Book not found." };

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  if (!title || !author) return { ok: false, error: "Title and author are required." };

  const rawStatus = String(formData.get("status") ?? "");
  const status = STATUSES.includes(rawStatus as never)
    ? (rawStatus as (typeof STATUSES)[number])
    : existing.status;
  const rawFormat = String(formData.get("format") ?? "");
  const format = FORMATS.includes(rawFormat as never)
    ? (rawFormat as (typeof FORMATS)[number])
    : existing.format;

  const pageCount = Math.max(0, Math.trunc(Number(formData.get("pageCount")) || 0));
  const currentPage = Math.min(
    pageCount,
    Math.max(0, Math.trunc(Number(formData.get("currentPage")) || 0)),
  );

  const rawRating = String(formData.get("rating") ?? "");
  const ratingNum = Number(rawRating);
  const rating =
    rawRating === "" || Number.isNaN(ratingNum)
      ? null
      : Math.min(5, Math.max(0, ratingNum));

  // Metadata (from a lookup pick); keep existing values when none supplied.
  const isbn = String(formData.get("isbn") ?? "").trim() || existing.isbn;
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || existing.coverUrl;
  const genresInput = parseGenres(formData.get("genres"));
  const genres = genresInput.length ? genresInput : existing.genres;

  const now = new Date();
  await db
    .update(books)
    .set({
      title,
      author,
      status,
      format,
      pageCount,
      currentPage,
      rating,
      isbn,
      coverUrl,
      genres,
      // Set timestamps on first transition into a state; never clobber them.
      startDate:
        status === "reading" && !existing.startDate ? now : existing.startDate,
      finishDate:
        status === "finished" && !existing.finishDate ? now : existing.finishDate,
    })
    .where(eq(books.id, id));

  revalidateBook(id);
  return { ok: true };
}

/** Log a reading session from the web: records pages read and advances the
 *  book's progress. Mirrors POST /api/sessions. */
export async function logSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };

  const bookId = String(formData.get("bookId") ?? "");
  if (!bookId) return { ok: false, error: "Missing book id." };

  const book = await db.query.books.findFirst({ where: eq(books.id, bookId) });
  if (!book) return { ok: false, error: "Book not found." };

  const toPage = Math.max(0, Math.trunc(Number(formData.get("toPage")) || 0));
  const fromPage = book.currentPage;
  if (toPage <= fromPage) {
    return { ok: false, error: `Enter a page past your current page (${fromPage}).` };
  }

  await db.insert(readingSessions).values({
    bookId,
    date: new Date(),
    fromPage,
    toPage,
    pagesRead: toPage - fromPage,
  });

  await db
    .update(books)
    .set({
      currentPage: Math.max(book.currentPage, toPage),
      status: book.status === "toread" ? "reading" : book.status,
      startDate: book.startDate ?? new Date(),
    })
    .where(eq(books.id, bookId));

  revalidateBook(bookId);
  return { ok: true };
}

/** Create a new quote, or update an existing one when `id` is present. */
export async function saveQuote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasDatabase || !db) return { ok: false, error: "Database not configured." };

  const id = String(formData.get("id") ?? "");
  const bookId = String(formData.get("bookId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { ok: false, error: "Quote text is required." };

  const pageNum = Math.trunc(Number(formData.get("page")));
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : null;

  if (id) {
    await db.update(quotes).set({ text, page }).where(eq(quotes.id, id));
  } else {
    if (!bookId) return { ok: false, error: "Missing book id." };
    await db.insert(quotes).values({ bookId, text, page });
  }

  if (bookId) revalidateBook(bookId);
  return { ok: true };
}

/** Delete a quote. Called imperatively (after a confirm) from the client. */
export async function deleteQuote(id: string, bookId: string): Promise<void> {
  if (!hasDatabase || !db || !id) return;
  await db.delete(quotes).where(eq(quotes.id, id));
  if (bookId) revalidateBook(bookId);
}

/** One-tap "mark as read": finish a book, dating it now and completing progress. */
export async function markFinished(formData: FormData): Promise<void> {
  if (!hasDatabase || !db) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const book = await db.query.books.findFirst({ where: eq(books.id, id) });
  if (!book) return;

  await db
    .update(books)
    .set({
      status: "finished",
      finishDate: book.finishDate ?? new Date(),
      startDate: book.startDate ?? new Date(),
      currentPage: book.pageCount > 0 ? book.pageCount : book.currentPage,
    })
    .where(eq(books.id, id));
  revalidateBook(id);
}
