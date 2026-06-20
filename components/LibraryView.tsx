"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BookWithRelations } from "@/lib/types";
import { progress } from "@/lib/types";
import { Cover } from "./Cover";
import { Stars } from "./Stars";
import { AddBookSheet } from "./AddBookSheet";
import { ChevronRightIcon, HeadphonesIcon, SearchIcon } from "./icons";

type Shelf = "reading" | "finished" | "toread";

const SHELVES: { key: Shelf; label: string }[] = [
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Read" },
  { key: "toread", label: "Want to Read" },
];

/** Group finished books by the year they were finished, newest year first. */
function byFinishYear(list: BookWithRelations[]) {
  const sorted = [...list].sort(
    (a, b) => (b.finishDate?.getTime() ?? 0) - (a.finishDate?.getTime() ?? 0),
  );
  const groups = new Map<string, BookWithRelations[]>();
  for (const b of sorted) {
    const y = b.finishDate ? String(b.finishDate.getFullYear()) : "Undated";
    (groups.get(y) ?? groups.set(y, []).get(y)!).push(b);
  }
  return [...groups.keys()]
    .sort((a, b) => (a === "Undated" ? 1 : b === "Undated" ? -1 : Number(b) - Number(a)))
    .map((year) => ({ year, books: groups.get(year)! }));
}

function BookTile({ book }: { book: BookWithRelations }) {
  return (
    <Link href={`/book/${book.id}`} style={{ display: "block" }}>
      <Cover book={book} width={96} />
      <div className="book-tile-title">{book.title}</div>
      {book.rating != null && (
        <div style={{ marginTop: 4 }}>
          <Stars rating={book.rating} size={12} />
        </div>
      )}
    </Link>
  );
}

export function LibraryView({ books }: { books: BookWithRelations[] }) {
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<Shelf>("reading");

  const counts = useMemo(
    () => ({
      reading: books.filter((b) => b.status === "reading").length,
      finished: books.filter((b) => b.status === "finished").length,
      toread: books.filter((b) => b.status === "toread").length,
    }),
    [books],
  );

  const shelfBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = books.filter((b) => b.status === shelf);
    if (shelf === "toread") list = list.sort((a, b) => a.queueOrder - b.queueOrder);
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
      );
    }
    return list;
  }, [books, shelf, query]);

  const libraryEmpty = books.length === 0;

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

        {libraryEmpty ? (
          <div className="empty">
            Your library is empty.
            <br />
            Tap + to log your first book.
          </div>
        ) : (
          <>
            <div className="search">
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                inputMode="search"
              />
            </div>

            <div className="shelf-tabs" role="tablist">
              {SHELVES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`shelf-tab${shelf === s.key ? " sel" : ""}`}
                  aria-selected={shelf === s.key}
                  onClick={() => setShelf(s.key)}
                >
                  {s.label}
                  <span className="shelf-count">{counts[s.key]}</span>
                </button>
              ))}
            </div>

            {shelfBooks.length === 0 ? (
              <div className="empty">
                {query
                  ? `No books match “${query}”.`
                  : "Nothing on this shelf yet."}
              </div>
            ) : shelf === "reading" ? (
              <div className="group">
                {shelfBooks.map((b) => (
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
            ) : shelf === "toread" ? (
              <div className="group">
                {shelfBooks.map((b) => (
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
            ) : (
              byFinishYear(shelfBooks).map(({ year, books: yearBooks }) => (
                <div key={year}>
                  <div className="section-header">{year}</div>
                  <div className="book-grid">
                    {yearBooks.map((b) => (
                      <BookTile key={b.id} book={b} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </main>
    </>
  );
}
