import { getBooks } from "@/lib/books";
import { LibraryView } from "@/components/LibraryView";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await requireAuth();
  const books = await getBooks();
  return <LibraryView books={books} />;
}
