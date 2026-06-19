import { getBooks } from "@/lib/books";
import { booksToGoodreadsCsv } from "@/lib/export";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Download the whole library as a Goodreads-format CSV. Gated by the session
 *  cookie (this route isn't in the bearer-authed /api space). */
export async function GET() {
  await requireAuth();
  const books = await getBooks();
  const csv = booksToGoodreadsCsv(books);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="marginalia-library-${date}.csv"`,
    },
  });
}
