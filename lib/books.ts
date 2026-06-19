import { db, hasDatabase } from "./db";
import { sampleBooks } from "./sample-data";
import type { BookWithRelations } from "./types";

/** All books with their quotes and sessions. Falls back to sample data when
 *  no database is configured. */
export async function getBooks(): Promise<BookWithRelations[]> {
  if (!hasDatabase || !db) return sampleBooks;
  const rows = await db.query.books.findMany({
    with: { quotes: true, sessions: true },
    orderBy: (b, { desc }) => [desc(b.dateAdded)],
  });
  return rows as BookWithRelations[];
}

export async function getBook(id: string): Promise<BookWithRelations | null> {
  if (!hasDatabase || !db) {
    return sampleBooks.find((b) => b.id === id) ?? null;
  }
  const row = await db.query.books.findFirst({
    where: (b, { eq }) => eq(b.id, id),
    with: { quotes: true, sessions: true },
  });
  return (row as BookWithRelations) ?? null;
}
