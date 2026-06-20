import { db, hasDatabase } from "./db";
import { sampleBooks } from "./sample-data";
import type { BookWithRelations } from "./types";

/** A user's books with their quotes and sessions. Falls back to sample data
 *  when no database is configured (local dev). */
export async function getBooks(userId: string): Promise<BookWithRelations[]> {
  if (!hasDatabase || !db) return sampleBooks;
  const rows = await db.query.books.findMany({
    where: (b, { eq }) => eq(b.userId, userId),
    with: { quotes: true, sessions: true },
    orderBy: (b, { desc }) => [desc(b.dateAdded)],
  });
  return rows as BookWithRelations[];
}

/** A single book, only if it belongs to the given user. */
export async function getBook(
  userId: string,
  id: string,
): Promise<BookWithRelations | null> {
  if (!hasDatabase || !db) {
    return sampleBooks.find((b) => b.id === id) ?? null;
  }
  const row = await db.query.books.findFirst({
    where: (b, { and, eq }) => and(eq(b.id, id), eq(b.userId, userId)),
    with: { quotes: true, sessions: true },
  });
  return (row as BookWithRelations) ?? null;
}
