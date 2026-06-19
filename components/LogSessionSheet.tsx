"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logSession, type ActionState } from "@/app/book/[id]/actions";
import type { Book } from "@/lib/types";

const initial: ActionState = { ok: false };

/** A "Log reading" CTA + sheet to record a reading session, advancing the
 *  book's progress and feeding the stats heatmap. */
export function LogSessionSheet({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(logSession, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Log reading
      </button>

      {open &&
        createPortal(
          <div
            className="sheet-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="sheet" role="dialog" aria-modal="true" aria-label="Log reading">
              <div className="sheet-grabber" />
              <div className="sheet-header">
                <button
                  type="button"
                  className="sheet-cancel"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <span className="sheet-title">Log Reading</span>
                <span className="sheet-spacer" />
              </div>

              <form action={formAction}>
                <input type="hidden" name="bookId" value={book.id} />
                <p className="sheet-note">
                  Currently on page {book.currentPage}
                  {book.pageCount ? ` of ${book.pageCount}` : ""}.
                </p>
                <div className="field">
                  <label htmlFor="ls-to">Read up to page</label>
                  <input
                    id="ls-to"
                    name="toPage"
                    type="number"
                    inputMode="numeric"
                    min={book.currentPage + 1}
                    defaultValue={book.currentPage + 1}
                    autoFocus
                  />
                </div>

                {state.error ? <p className="sheet-error">{state.error}</p> : null}

                <button className="btn-primary" type="submit" disabled={pending}>
                  {pending ? "Logging…" : "Log Session"}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
