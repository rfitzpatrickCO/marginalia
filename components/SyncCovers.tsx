"use client";

import { useState } from "react";
import { syncCovers } from "@/app/settings/actions";

/** Settings row that re-fetches reliable cover art for the whole library. */
export function SyncCovers() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setStatus("Syncing covers…");
    try {
      const res = await syncCovers();
      setStatus(
        res.ok
          ? `Updated ${res.updated} of ${res.checked} covers.`
          : (res.error ?? "Sync failed."),
      );
    } catch {
      setStatus("Sync failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="group spaced">
        <button type="button" className="row" disabled={busy} onClick={onClick}>
          <span className="row-label">
            <span className="row-title">Sync book covers</span>
            <span className="row-sub">
              {busy ? "Syncing…" : "Refresh cover art from Google Books"}
            </span>
          </span>
        </button>
      </div>
      {status && !busy ? <div className="section-footer">{status}</div> : null}
    </>
  );
}
