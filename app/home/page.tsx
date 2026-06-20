import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getBooks } from "@/lib/books";
import { getMonthStats } from "@/lib/stats";
import { Cover } from "@/components/Cover";
import { HeadphonesIcon } from "@/components/icons";
import { progress } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireAuth();
  const books = await getBooks();
  const month = await getMonthStats();

  const reading = books
    .filter((b) => b.status === "reading")
    .sort((a, b) => (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0));

  const cards: Array<{ num: string; unit?: string; label: string }> = [
    { num: String(month.booksThisMonth), label: "Books read" },
    { num: month.pagesThisMonth.toLocaleString(), label: "Pages read" },
    {
      num: String(month.currentStreak),
      unit: month.currentStreak === 1 ? "day" : "days",
      label: "Streak",
    },
  ];

  return (
    <main className="scroll">
      <h1 className="large-title">Home</h1>

      <div className="section-header">Currently Reading</div>
      {reading.length === 0 ? (
        <div className="empty">
          Nothing in progress.
          <br />
          Start a book from your library.
        </div>
      ) : (
        <div className="group">
          {reading.map((b) => (
            <Link
              key={b.id}
              href={`/book/${b.id}`}
              className="cr-card row inset-sep"
            >
              <Cover book={b} width={56} />
              <div className="row-label">
                <div className="cr-title">{b.title}</div>
                <div className="cr-author">{b.author}</div>
                <div style={{ marginTop: 9 }}>
                  <div className="track">
                    <i style={{ width: `${Math.round(progress(b) * 100)}%` }} />
                  </div>
                  <div className="progress-meta">
                    {b.format === "audiobook" ? (
                      <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                        <HeadphonesIcon /> Audiobook
                      </span>
                    ) : (
                      <span>
                        {b.currentPage} / {b.pageCount}
                      </span>
                    )}
                    {b.format !== "audiobook" && (
                      <span className="pct">{Math.round(progress(b) * 100)}%</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="section-header">{month.label}</div>
      <div className="stat-grid stat-grid-3">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-num">
              {c.num}
              {c.unit ? <span className="unit">{c.unit}</span> : null}
            </div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
