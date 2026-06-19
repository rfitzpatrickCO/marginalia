"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "marginalia-theme";
const OPTIONS: Theme[] = ["light", "dark", "system"];

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/** Apply a theme to the document and keep the PWA status-bar color in sync. */
function apply(theme: Theme) {
  const mode = resolve(theme);
  document.documentElement.dataset.theme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#000000" : "#f2f2f7");
}

/** Light / Dark / System segmented control. Persists to localStorage; an inline
 *  script in the layout applies the saved choice before paint to avoid a flash. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Sync the control with the stored choice after hydration.
  useEffect(() => {
    setTheme((localStorage.getItem(KEY) as Theme | null) ?? "system");
  }, []);

  // While on "system", follow OS changes live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }

  return (
    <div className="segmented" role="group" aria-label="Theme">
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          className={`seg${theme === o ? " sel" : ""}`}
          aria-pressed={theme === o}
          onClick={() => choose(o)}
        >
          {o[0].toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  );
}
