import { revalidatePath } from "next/cache";
import { db, hasDatabase } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { userFromBearer } from "@/lib/auth";

const STATUSES = ["reading", "toread", "finished"] as const;
const FORMATS = ["hardcover", "paperback", "ebook", "audiobook"] as const;

/**
 * Quick-add a book from iOS Shortcuts.
 *   POST /api/books   { title, author, status?, pageCount?, format?, series?, seriesNumber? }
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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  if (!title || !author) {
    return Response.json(
      { error: "`title` and `author` are required" },
      { status: 400 },
    );
  }

  const status = STATUSES.includes(body.status as never)
    ? (body.status as (typeof STATUSES)[number])
    : "toread";
  const format = FORMATS.includes(body.format as never)
    ? (body.format as (typeof FORMATS)[number])
    : "hardcover";
  const pageCount = Number.isFinite(body.pageCount) ? Number(body.pageCount) : 0;

  const now = new Date();
  const [book] = await db
    .insert(books)
    .values({
      userId: user.id,
      title,
      author,
      status,
      format,
      pageCount,
      series: typeof body.series === "string" ? body.series : null,
      seriesNumber: Number.isFinite(body.seriesNumber)
        ? Number(body.seriesNumber)
        : null,
      // Match the web "add book" side-effects so iOS-added books land complete.
      ...(status === "reading" ? { startDate: now } : {}),
      ...(status === "finished" ? { finishDate: now, currentPage: pageCount } : {}),
    })
    .returning();

  revalidatePath("/library");
  return Response.json({ book }, { status: 201 });
}
