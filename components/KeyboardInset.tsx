"use client";

import { useEffect } from "react";

/** Exposes the on-screen keyboard height as the CSS variable `--kb` on <html>.
 *  Bottom sheets use it to lift above the keyboard instead of hiding behind it.
 *  Uses the visual viewport, which shrinks when the keyboard opens (both iOS and
 *  Android). No-op on desktop (no soft keyboard → --kb stays 0). */
export function KeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb", `${inset}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
