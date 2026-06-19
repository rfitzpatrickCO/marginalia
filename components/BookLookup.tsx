"use client";

import { useState } from "react";
import { searchBooks } from "@/app/library/actions";
import type { BookSearchResult } from "@/lib/book-search";
import { SearchIcon } from "./icons";

/** Shared "search a book and pick a match" control used by the add and edit
 *  sheets. Calls onPick with the chosen result; the parent decides what to do
 *  with the metadata. */
export function BookLookup({
  onPick,
}: {
  onPick: (result: BookSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function onSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await searchBooks(q));
    } finally {
      setSearching(false);
    }
  }

  function choose(r: BookSearchResult) {
    onPick(r);
    setResults(null);
    setQuery("");
  }

  return (
    <div className="lookup">
      <div className="search">
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
          placeholder="Search title or author"
          inputMode="search"
          autoComplete="off"
        />
        <button
          type="button"
          className="lookup-btn"
          onClick={onSearch}
          disabled={searching || !query.trim()}
        >
          {searching ? "…" : "Search"}
        </button>
      </div>

      {results !== null && (
        <div className="results">
          {results.length === 0 ? (
            <div className="results-empty">No matches found.</div>
          ) : (
            results.map((r, i) => (
              <button
                type="button"
                className="result row"
                key={`${r.isbn ?? r.title}-${i}`}
                onClick={() => choose(r)}
              >
                {r.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="result-cover"
                    src={r.coverUrl}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <span className="result-cover result-cover-blank" />
                )}
                <span className="row-label">
                  <span className="row-title">{r.title}</span>
                  <span className="row-sub">
                    {r.author || "Unknown author"}
                    {r.pageCount ? ` · ${r.pageCount} pp` : ""}
                    {r.publishedYear ? ` · ${r.publishedYear}` : ""}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
