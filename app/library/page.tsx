import { getBooks } from "@/lib/books";
import { LibraryView } from "@/components/LibraryView";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const books = await getBooks();
  return <LibraryView books={books} />;
}
