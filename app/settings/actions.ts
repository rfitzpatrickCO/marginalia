"use server";

import { revalidatePath } from "next/cache";
import { db, hasDatabase } from "@/lib/db";
import { books } from "@/lib/db/schema";
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

  const parsed = parseGoodreadsCsv(csvText);
  if (parsed.length === 0) {
    return {
      ok: false,
      error: "No books found — is this a Goodreads library export CSV?",
    };
  }

  const existing = await db.query.books.findMany({
    columns: { title: true, author: true, isbn: true },
  });
  const seenIsbn = new Set(
    existing.map((e) => e.isbn).filter((v): v is string => Boolean(v)),
  );
  const key = (t: string, a: string) => `${t.toLowerCase()}|${a.toLowerCase()}`;
  const seenKey = new Set(existing.map((e) => key(e.title, e.author)));

  const toInsert = parsed.filter((b) => {
    if (b.isbn && seenIsbn.has(b.isbn)) return false;
    return !seenKey.has(key(b.title, b.author));
  });

  // Insert in chunks to keep the statement's parameter count reasonable.
  for (let i = 0; i < toInsert.length; i += 100) {
    await db.insert(books).values(toInsert.slice(i, i + 100));
  }

  if (toInsert.length > 0) {
    revalidatePath("/library");
    revalidatePath("/stats");
  }
  return {
    ok: true,
    imported: toInsert.length,
    skipped: parsed.length - toInsert.length,
  };
}
