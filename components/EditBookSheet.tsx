"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateBook, type ActionState } from "@/app/book/[id]/actions";
import type { BookSearchResult } from "@/lib/book-search";
import type { Book } from "@/lib/types";
import { BookLookup } from "./BookLookup";

const initial: ActionState = { ok: false };

const RATINGS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];

type Meta = { isbn: string | null; coverUrl: string | null; genres: string[] };

/** "Edit" nav button + sheet to change a book's fields, status, progress, and
 *  rating. Prefilled from the current book; a metadata lookup can refresh the
 *  title/author/pages/cover/genres. Saves via the updateBook action. */
export function EditBookSheet({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateBook, initial);

  // Fields a lookup can overwrite are controlled; progress/rating stay uncontrolled.
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [pageCount, setPageCount] = useState(String(book.pageCount));
  const [meta, setMeta] = useState<Meta>({
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    genres: book.genres,
  });

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  // Reset to the book's current values each time the sheet opens, discarding any
  // unsaved edits from a previous open.
  function openSheet() {
    setTitle(book.title);
    setAuthor(book.author);
    setPageCount(String(book.pageCount));
    setMeta({ isbn: book.isbn, coverUrl: book.coverUrl, genres: book.genres });
    setOpen(true);
  }

  function pick(r: BookSearchResult) {
    setTitle(r.title);
    setAuthor(r.author);
    if (r.pageCount) setPageCount(String(r.pageCount));
    setMeta((m) => ({
      isbn: r.isbn ?? m.isbn,
      coverUrl: r.coverUrl ?? m.coverUrl,
      genres: r.genres.length ? r.genres : m.genres,
    }));
  }

  return (
    <>
      <button className="nav-btn" onClick={openSheet}>
        Edit
      </button>

      {open &&
        createPortal(
          <div
            className="sheet-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="sheet" role="dialog" aria-modal="true" aria-label="Edit book">
              <div className="sheet-grabber" />
              <div className="sheet-header">
                <button
                  type="button"
                  className="sheet-cancel"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <span className="sheet-title">Edit Book</span>
                <span className="sheet-spacer" />
              </div>

              <BookLookup onPick={pick} />

              <form action={formAction}>
                <input type="hidden" name="id" value={book.id} />
                <input type="hidden" name="isbn" value={meta.isbn ?? ""} />
                <input type="hidden" name="coverUrl" value={meta.coverUrl ?? ""} />
                <input type="hidden" name="genres" value={JSON.stringify(meta.genres)} />

                <div className="field">
                  <label htmlFor="eb-title">Title</label>
                  <input
                    id="eb-title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label htmlFor="eb-author">Author</label>
                  <input
                    id="eb-author"
                    name="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="eb-status">Shelf</label>
                    <select id="eb-status" name="status" defaultValue={book.status}>
                      <option value="reading">Currently Reading</option>
                      <option value="toread">Up Next</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="eb-format">Format</label>
                    <select id="eb-format" name="format" defaultValue={book.format}>
                      <option value="hardcover">Hardcover</option>
                      <option value="paperback">Paperback</option>
                      <option value="ebook">eBook</option>
                      <option value="audiobook">Audiobook</option>
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="eb-current">Current page</label>
                    <input
                      id="eb-current"
                      name="currentPage"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      defaultValue={book.currentPage}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="eb-pages">Page count</label>
                    <input
                      id="eb-pages"
                      name="pageCount"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="eb-rating">Rating</label>
                  <select
                    id="eb-rating"
                    name="rating"
                    defaultValue={book.rating != null ? String(book.rating) : ""}
                  >
                    <option value="">Unrated</option>
                    {RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {r} ★
                      </option>
                    ))}
                  </select>
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
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
