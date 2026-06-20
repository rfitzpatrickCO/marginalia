"use client";

import { useState } from "react";
import { generateApiToken } from "@/app/settings/actions";

/** Generate (or rotate) the per-user iOS Shortcuts bearer token. Shown once. */
export function ApiTokenRow({ hasToken }: { hasToken: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await generateApiToken();
      if (res.ok) setToken(res.token);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="group spaced">
        <button type="button" className="row" disabled={busy} onClick={generate}>
          <span className="row-label">
            <span className="row-title">iOS Shortcuts token</span>
            <span className="row-sub">
              {busy
                ? "Generating…"
                : hasToken || token
                  ? "Tap to regenerate (invalidates the old one)"
                  : "Tap to generate a token for the Shortcuts API"}
            </span>
          </span>
        </button>
      </div>
      {token && (
        <div className="section-footer">
          <code className="token-value">{token}</code>
          <br />
          Copy this now — it won&apos;t be shown again.
        </div>
      )}
    </>
  );
}
