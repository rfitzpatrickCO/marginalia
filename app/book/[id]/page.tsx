import { notFound } from "next/navigation";
import { getBook } from "@/lib/books";
import { Cover } from "@/components/Cover";
import { Stars } from "@/components/Stars";
import { Nav } from "@/components/Nav";
import { EditBookSheet } from "@/components/EditBookSheet";
import { LogSessionSheet } from "@/components/LogSessionSheet";
import { QuotesSection } from "@/components/QuotesSection";
import { FORMAT_LABELS, progress } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const facts: Array<[string, string]> = [
    ["Format", FORMAT_LABELS[book.format]],
    ["Pages", book.pageCount ? String(book.pageCount) : "—"],
    book.series ? ["Series", book.series + (book.seriesNumber ? ` #${book.seriesNumber}` : "")] : ["Language", book.language],
    ["Genre", book.genres.length ? book.genres.join(", ") : "—"],
  ];

  return (
    <>
      <Nav
        title={book.title}
        back={{ href: "/library", label: "Library" }}
        right={<EditBookSheet book={book} />}
      />
      <main className="scroll">
        <div className="detail-hero">
          <Cover book={book} width={120} />
          <h1 className="detail-title">{book.title}</h1>
          <div className="detail-author">{book.author}</div>
          {book.series && (
            <div className="detail-series">
              {book.series}
              {book.seriesNumber ? ` #${book.seriesNumber}` : ""}
            </div>
          )}
          {book.rating != null && (
            <div style={{ marginTop: 10 }}>
              <Stars rating={book.rating} size={18} />
            </div>
          )}
        </div>

        {book.status === "reading" && (
          <>
            <div className="section-header">Progress</div>
            <div className="group" style={{ padding: "14px 16px" }}>
              <div className="track">
                <i style={{ width: `${Math.round(progress(book) * 100)}%` }} />
              </div>
              <div className="progress-meta">
                <span>
                  {book.format === "audiobook"
                    ? "Audiobook"
                    : `${book.currentPage} of ${book.pageCount} pages`}
                </span>
                {book.format !== "audiobook" && (
                  <span className="pct">{Math.round(progress(book) * 100)}%</span>
                )}
              </div>
            </div>
          </>
        )}

        {book.status !== "finished" && (
          <div className="detail-actions">
            <LogSessionSheet book={book} />
          </div>
        )}

        <div className="section-header">Details</div>
        <div className="group">
          <div className="fact-grid">
            {facts.map(([k, v], i) => (
              <div className="fact row" key={`${k}-${i}`}>
                <div>
                  <div className="fact-k">{k}</div>
                  <div className="fact-v">{v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {book.notes && (
          <>
            <div className="section-header">Notes</div>
            <div className="group">
              <div className="body-text">{book.notes}</div>
            </div>
          </>
        )}

        {book.review && (
          <>
            <div className="section-header">Review</div>
            <div className="group">
              <div className="body-text">{book.review}</div>
            </div>
          </>
        )}

        <QuotesSection bookId={book.id} quotes={book.quotes} />
      </main>
    </>
  );
}
