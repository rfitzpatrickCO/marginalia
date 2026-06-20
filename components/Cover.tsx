import type { Book } from "@/lib/types";
import { CoverImage } from "./CoverImage";

type Tone = { base: string; edge: string; ink: string };

const TONES: Record<string, Tone> = {
  carr: { base: "#2a1715", edge: "#120a09", ink: "#e9c9a3" }, // oxblood
  grey: { base: "#1b2228", edge: "#0b0f12", ink: "#cfd8de" }, // gunmetal
  thor: { base: "#13211c", edge: "#080f0c", ink: "#bcd6c6" }, // forest
};

const DEFAULT: Tone = { base: "#2a2a30", edge: "#111114", ink: "#e8e2d6" };

/** Generated gradient cover keyed to a series tone, with a serif title.
 *  No network art — covers never break. */
export function Cover({
  book,
  width = 46,
}: {
  book: Pick<Book, "title" | "tone" | "coverUrl">;
  width?: number;
}) {
  const tone = (book.tone && TONES[book.tone]) || DEFAULT;
  const height = Math.round(width * 1.5);
  // Make Open Library return a 404 (not a gray placeholder) for missing covers,
  // so CoverImage's onError reveals the generated fallback instead of a blank box.
  const src =
    book.coverUrl &&
    book.coverUrl.includes("covers.openlibrary.org") &&
    !book.coverUrl.includes("?")
      ? `${book.coverUrl}?default=false`
      : book.coverUrl;
  return (
    <div
      className="cover"
      style={{
        width,
        height,
        background: `linear-gradient(150deg, ${tone.base}, ${tone.edge})`,
      }}
    >
      <div
        className="cover-title"
        style={
          {
            "--cover-ink": tone.ink,
            fontSize: Math.max(8, Math.round(width * 0.15)),
          } as React.CSSProperties
        }
      >
        {book.title}
      </div>
      {src ? <CoverImage src={src} alt={book.title} /> : null}
    </div>
  );
}
