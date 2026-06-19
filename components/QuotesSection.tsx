"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { saveQuote, deleteQuote, type ActionState } from "@/app/book/[id]/actions";
import type { Quote } from "@/lib/types";
import { PlusIcon, TrashIcon } from "./icons";

const initial: ActionState = { ok: false };

/** The book-detail "Quotes" section: lists saved quotes (tap to edit, trash to
 *  delete) and an "Add a quote" sheet. */
export function QuotesSection({
  bookId,
  quotes,
}: {
  bookId: string;
  quotes: Quote[];
}) {
  // null = closed, "new" = adding, Quote = editing that quote.
  const [sheetFor, setSheetFor] = useState<Quote | "new" | null>(null);
  const [state, formAction, pending] = useActionState(saveQuote, initial);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok) setSheetFor(null);
  }, [state]);

  const sorted = [...quotes].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  function onDelete(id: string) {
    if (!confirm("Delete this quote?")) return;
    startDelete(() => deleteQuote(id, bookId));
  }

  const editing = sheetFor !== null && sheetFor !== "new" ? sheetFor : null;

  return (
    <>
      <div className="section-header">Quotes</div>
      <div className="group">
        {sorted.map((q) => (
          <div className="quote-card row" key={q.id}>
            <button
              type="button"
              className="quote-body"
              onClick={() => setSheetFor(q)}
            >
              <div className="quote-text">“{q.text}”</div>
              {q.page != null && <div className="quote-meta">p. {q.page}</div>}
            </button>
            <button
              type="button"
              className="quote-del"
              aria-label="Delete quote"
              disabled={deleting}
              onClick={() => onDelete(q.id)}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="row add-row"
          onClick={() => setSheetFor("new")}
        >
          <PlusIcon size={20} />
          <span>Add a quote</span>
        </button>
      </div>

      {sheetFor !== null &&
        createPortal(
          <div
            className="sheet-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSheetFor(null);
            }}
          >
            <div className="sheet" role="dialog" aria-modal="true" aria-label="Quote">
              <div className="sheet-grabber" />
              <div className="sheet-header">
                <button
                  type="button"
                  className="sheet-cancel"
                  onClick={() => setSheetFor(null)}
                >
                  Cancel
                </button>
                <span className="sheet-title">
                  {editing ? "Edit Quote" : "Add Quote"}
                </span>
                <span className="sheet-spacer" />
              </div>

              <form action={formAction}>
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="id" value={editing?.id ?? ""} />
                <div className="field">
                  <label htmlFor="q-text">Quote</label>
                  <textarea
                    id="q-text"
                    name="text"
                    rows={4}
                    autoFocus
                    defaultValue={editing?.text ?? ""}
                    placeholder="A passage worth keeping…"
                  />
                </div>
                <div className="field">
                  <label htmlFor="q-page">Page (optional)</label>
                  <input
                    id="q-page"
                    name="page"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    defaultValue={editing?.page ?? ""}
                    placeholder="—"
                  />
                </div>

                {state.error ? <p className="sheet-error">{state.error}</p> : null}

                <button className="btn-primary" type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save Quote"}
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
