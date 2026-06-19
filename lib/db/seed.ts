/**
 * Seeds the database with the sample library and a synthesized reading history.
 * Each step is guarded independently, so re-running backfills only what's
 * missing (e.g. sessions for an already-seeded library). Run with
 * `npm run db:seed`.
 */
import { db, hasDatabase } from "./index";
import { books, quotes, readingSessions } from "./schema";
import { seedRows, generateSessions } from "../sample-data";

async function seedBooks() {
  for (const seed of seedRows) {
    const { quotes: bookQuotes, ...bookData } = seed;
    const [row] = await db!.insert(books).values(bookData).returning();
    if (bookQuotes?.length) {
      await db!.insert(quotes).values(
        bookQuotes.map((q) => ({
          bookId: row.id,
          text: q.text,
          page: q.page ?? null,
          createdAt: q.createdAt ?? new Date(),
        })),
      );
    }
    console.log(`Seeded: ${row.title}`);
  }
}

async function seedSessions() {
  const allBooks = await db!.query.books.findMany();
  const rows = allBooks.flatMap((b) =>
    generateSessions(b).map((s) => ({ bookId: b.id, ...s })),
  );
  if (rows.length) await db!.insert(readingSessions).values(rows);
  console.log(`Seeded ${rows.length} reading sessions.`);
}

async function main() {
  if (!hasDatabase || !db) {
    throw new Error("DATABASE_URL is not set — nothing to seed.");
  }

  if (await db.query.books.findFirst()) {
    console.log("Books already present — skipping book seed.");
  } else {
    await seedBooks();
  }

  if (await db.query.readingSessions.findFirst()) {
    console.log("Reading sessions already present — skipping.");
  } else {
    await seedSessions();
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
