"use client";

import { useRef, useState } from "react";
import { importGoodreads } from "@/app/settings/actions";

/** Settings row that uploads a Goodreads export CSV and imports it. Parsing and
 *  insertion happen in the importGoodreads server action. */
export function GoodreadsImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Importing…");
    try {
      const res = await importGoodreads(await file.text());
      if (res.ok) {
        const skipped = res.skipped
          ? ` · skipped ${res.skipped} already in your library`
          : "";
        setStatus(`Imported ${res.imported} book${res.imported === 1 ? "" : "s"}${skipped}.`);
      } else {
        setStatus(res.error ?? "Import failed.");
      }
    } catch {
      setStatus("Couldn't read that file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="group">
        <button
          type="button"
          className="row"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <span className="row-label">
            <span className="row-title">Import from Goodreads</span>
            <span className="row-sub">
              {busy ? "Importing…" : "Upload your library export (CSV)"}
            </span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onFile}
        />
      </div>
      {status && !busy ? <div className="section-footer">{status}</div> : null}
    </>
  );
}
