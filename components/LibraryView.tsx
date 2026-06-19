"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BookWithRelations } from "@/lib/types";
import { progress } from "@/lib/types";
import { Cover } from "./Cover";
import { Stars } from "./Stars";
import { AddBookSheet } from "./AddBookSheet";
import { ChevronRightIcon, HeadphonesIcon, SearchIcon } from "./icons";

export function LibraryView({ books }: { books: BookWithRelations[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q),
    );
  }, [books, query]);

  const reading = filtered.filter((b) => b.status === "reading");
  const upNext = filtered
    .filter((b) => b.status === "toread")
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const finished = filtered
    .filter((b) => b.status === "finished")
    .sort(
      (a, b) =>
        (b.finishDate?.getTime() ?? 0) - (a.finishDate?.getTime() ?? 0),
    );

  const libraryEmpty = books.length === 0;
  const noMatches = !libraryEmpty && filtered.length === 0;

  return (
    <>
      <header className="nav">
        <span className="nav-title-inline" style={{ opacity: 0 }}>
          Library
        </span>
        <div className="nav-right">
          <AddBookSheet />
        </div>
      </header>

      <main className="scroll">
        <h1 className="large-title">Library</h1>

        {!libraryEmpty && (
          <div className="search">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              inputMode="search"
            />
          </div>
        )}

        {libraryEmpty && (
          <div className="empty">
            Your library is empty.
            <br />
            Tap + to log your first book.
          </div>
        )}
        {noMatches && <div className="empty">No books match “{query}”.</div>}

        {reading.length > 0 && (
          <>
            <div className="section-header">Currently Reading</div>
            <div className="group">
              {reading.map((b) => (
                <Link key={b.id} href={`/book/${b.id}`} className="cr-card row inset-sep">
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
          </>
        )}

        {upNext.length > 0 && (
          <>
            <div className="section-header">Up Next</div>
            <div className="group">
              {upNext.map((b) => (
                <Link key={b.id} href={`/book/${b.id}`} className="row inset-sep">
                  <Cover book={b} width={38} />
                  <div className="row-label">
                    <div className="row-title">{b.title}</div>
                    <div className="row-sub">{b.author}</div>
                  </div>
                  <ChevronRightIcon className="chevron" />
                </Link>
              ))}
            </div>
          </>
        )}

        {finished.length > 0 && (
          <>
            <div className="section-header">Finished</div>
            <div className="book-grid">
              {finished.map((b) => (
                <Link key={b.id} href={`/book/${b.id}`} style={{ display: "block" }}>
                  <Cover book={b} width={96} />
                  <div className="book-tile-title">{b.title}</div>
                  {b.rating != null && (
                    <div style={{ marginTop: 4 }}>
                      <Stars rating={b.rating} size={12} />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
