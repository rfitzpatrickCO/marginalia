"use client";

import { useState } from "react";

/** Real cover art layered over the generated gradient. If the image fails to
 *  load (Open Library has no cover, network error, etc.) it removes itself,
 *  revealing the generated fallback underneath — covers never break. */
export function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="cover-img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
