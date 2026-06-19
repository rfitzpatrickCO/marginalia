"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createBook, type CreateBookState } from "@/app/library/actions";
import type { BookSearchResult } from "@/lib/book-search";
import { BookLookup } from "./BookLookup";
import { PlusIcon } from "./icons";

const initial: CreateBookState = { ok: false };

type Meta = { isbn: string | null; coverUrl: string | null; genres: string[] };
const emptyMeta: Meta = { isbn: null, coverUrl: null, genres: [] };

/** The "+" nav button and the bottom-sheet form behind it. Supports looking up
 *  metadata + cover art (Google Books / Open Library) and prefilling the form,
 *  or filling it in by hand. */
export function AddBookSheet() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBook, initial);

  // Controlled fields so a search result can prefill them.
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [meta, setMeta] = useState<Meta>(emptyMeta);

  function reset() {
    setTitle("");
    setAuthor("");
    setPageCount("");
    setMeta(emptyMeta);
  }

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      reset();
    }
  }, [state]);

  function pick(r: BookSearchResult) {
    setTitle(r.title);
    setAuthor(r.author);
    setPageCount(r.pageCount ? String(r.pageCount) : "");
    setMeta({ isbn: r.isbn, coverUrl: r.coverUrl, genres: r.genres });
  }

  return (
    <>
      <button
        className="nav-btn nav-icon-btn"
        aria-label="Log a book"
        onClick={() => setOpen(true)}
      >
        <PlusIcon size={24} />
      </button>

      {open &&
        createPortal(
          <div
            className="sheet-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="sheet" role="dialog" aria-modal="true" aria-label="Add a book">
              <div className="sheet-grabber" />
              <div className="sheet-header">
                <button
                  type="button"
                  className="sheet-cancel"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <span className="sheet-title">Add Book</span>
                <span className="sheet-spacer" />
              </div>

              <BookLookup onPick={pick} />

              <form action={formAction}>
                <input type="hidden" name="isbn" value={meta.isbn ?? ""} />
                <input type="hidden" name="coverUrl" value={meta.coverUrl ?? ""} />
                <input type="hidden" name="genres" value={JSON.stringify(meta.genres)} />

                <div className="field">
                  <label htmlFor="ab-title">Title</label>
                  <input
                    id="ab-title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label htmlFor="ab-author">Author</label>
                  <input
                    id="ab-author"
                    name="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="ab-status">Shelf</label>
                    <select id="ab-status" name="status" defaultValue="toread">
                      <option value="reading">Currently Reading</option>
                      <option value="toread">Up Next</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="ab-format">Format</label>
                    <select id="ab-format" name="format" defaultValue="hardcover">
                      <option value="hardcover">Hardcover</option>
                      <option value="paperback">Paperback</option>
                      <option value="ebook">eBook</option>
                      <option value="audiobook">Audiobook</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="ab-pages">Page count</label>
                  <input
                    id="ab-pages"
                    name="pageCount"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>

                {meta.genres.length > 0 && (
                  <div className="chips">
                    {meta.genres.map((g) => (
                      <span className="tag" key={g}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {state.error ? <p className="sheet-error">{state.error}</p> : null}

                <button className="btn-primary" type="submit" disabled={pending}>
                  {pending ? "Adding…" : "Add to Library"}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
