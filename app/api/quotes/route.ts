import { revalidatePath } from "next/cache";
import { and, eq, ilike } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/db";
import { books, quotes } from "@/lib/db/schema";
import { userFromBearer } from "@/lib/auth";

/**
 * Capture a quote from iOS Shortcuts. The book is matched by `bookId` (uuid)
 * or, failing that, by exact `title` (case-insensitive).
 *   POST /api/quotes   { bookId?, title?, text, page? }
 */
export async function POST(req: Request) {
  const user = await userFromBearer(req);
  if (!user) {
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

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "`text` is required" }, { status: 400 });
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
    where: and(
      eq(books.userId, user.id),
      bookId ? eq(books.id, bookId) : ilike(books.title, title),
    ),
  });
  if (!book) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  const pageNum = Math.trunc(Number(body.page));
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : null;

  const [quote] = await db
    .insert(quotes)
    .values({ bookId: book.id, text, page })
    .returning();

  revalidatePath("/library");
  revalidatePath(`/book/${book.id}`);
  return Response.json({ quote }, { status: 201 });
}
