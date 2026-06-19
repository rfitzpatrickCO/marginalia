"use client";

import { useEffect, useRef } from "react";

/** Scroll container that starts at its right edge, so the heatmap opens on the
 *  most recent weeks rather than a year ago. */
export function HeatScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  return (
    <div className="heatmap-scroll" ref={ref}>
      {children}
    </div>
  );
}
