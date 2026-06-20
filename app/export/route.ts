import { getBooks } from "@/lib/books";
import { booksToGoodreadsCsv } from "@/lib/export";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Download the signed-in user's library as a Goodreads-format CSV. */
export async function GET() {
  const user = await requireUser();
  const books = await getBooks(user.id);
  const csv = booksToGoodreadsCsv(books);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="marginalia-library-${date}.csv"`,
    },
  });
}
