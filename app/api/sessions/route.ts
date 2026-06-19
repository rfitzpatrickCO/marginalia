import { revalidatePath } from "next/cache";
import { eq, ilike } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/db";
import { books, readingSessions } from "@/lib/db/schema";
import { checkBearer } from "@/lib/auth";

/**
 * Log a reading session from iOS Shortcuts. The book is matched by `bookId`
 * (uuid) or, failing that, by exact `title` (case-insensitive). Logging a
 * session also advances the book's current page and flips a "to read" book to
 * "reading".
 *   POST /api/sessions   { bookId? , title?, fromPage?, toPage, date? }
 */
export async function POST(req: Request) {
  if (!checkBearer(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabase || !db) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bookId = typeof body.bookId === "string" ? body.bookId : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!bookId && !title) {
    return Response.json(
      { error: "Provide `bookId` or `title` to identify the book" },
      { status: 400 },
    );
  }

  const book = await db.query.books.findFirst({
    where: bookId ? eq(books.id, bookId) : ilike(books.title, title),
  });
  if (!book) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  const toPage = Number.isFinite(body.toPage)
    ? Number(body.toPage)
    : book.currentPage;
  const fromPage = Number.isFinite(body.fromPage)
    ? Number(body.fromPage)
    : book.currentPage;
  const pagesRead = Math.max(0, toPage - fromPage);
  const date =
    typeof body.date === "string" && !Number.isNaN(Date.parse(body.date))
      ? new Date(body.date)
      : new Date();

  const [session] = await db
    .insert(readingSessions)
    .values({ bookId: book.id, date, fromPage, toPage, pagesRead })
    .returning();

  // Advance progress; never move the page counter backwards.
  await db
    .update(books)
    .set({
      currentPage: Math.max(book.currentPage, toPage),
      status: book.status === "toread" ? "reading" : book.status,
    })
    .where(eq(books.id, book.id));

  revalidatePath("/library");
  revalidatePath("/stats");
  revalidatePath(`/book/${book.id}`);
  return Response.json({ session }, { status: 201 });
}
