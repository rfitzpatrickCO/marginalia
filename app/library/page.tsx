import { getBooks } from "@/lib/books";
import { LibraryView } from "@/components/LibraryView";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const books = await getBooks(user.id);
  return <LibraryView books={books} />;
}
