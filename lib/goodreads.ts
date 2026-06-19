import { books } from "./db/schema";

type NewBook = typeof books.$inferInsert;
type Status = NewBook["status"];
type Format = NewBook["format"];

/** Parse CSV text into rows, honoring quoted fields, doubled quotes, and
 *  newlines inside quotes (Goodreads reviews contain all three). */
function splitRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Goodreads writes ISBNs as ="9780553418026"; keep only digits/X.
function cleanIsbn(raw: string): string | null {
  const v = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  return v.length >= 10 ? v : null;
}

function toStatus(shelf: string): Status {
  const s = shelf.trim().toLowerCase();
  if (s === "read") return "finished";
  if (s === "currently-reading") return "reading";
  return "toread";
}

function toFormat(binding: string): Format {
  const b = binding.toLowerCase();
  if (b.includes("audio")) return "audiobook";
  if (b.includes("kindle") || b.includes("ebook") || b.includes("e-book")) {
    return "ebook";
  }
  if (b.includes("paperback")) return "paperback";
  return "hardcover";
}

function parseDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t.replace(/\//g, "-"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Convert a Goodreads library-export CSV into insertable book rows. Returns []
 *  when the text isn't a recognizable Goodreads export. */
export function parseGoodreadsCsv(text: string): NewBook[] {
  const rows = splitRows(text);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const iTitle = col("Title");
  const iAuthor = col("Author");
  if (iTitle < 0 || iAuthor < 0) return [];

  const iIsbn13 = col("ISBN13");
  const iIsbn = col("ISBN");
  const iRating = col("My Rating");
  const iPages = col("Number of Pages");
  const iShelf = col("Exclusive Shelf");
  const iBinding = col("Binding");
  const iDateRead = col("Date Read");
  const iDateAdded = col("Date Added");

  const get = (row: string[], i: number) => (i >= 0 && i < row.length ? row[i] : "");

  const out: NewBook[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = get(row, iTitle).trim();
    const author = get(row, iAuthor).trim();
    if (!title || !author) continue;

    const isbn = cleanIsbn(get(row, iIsbn13)) ?? cleanIsbn(get(row, iIsbn));
    const ratingNum = Number(get(row, iRating));
    const status = toStatus(get(row, iShelf));
    const pageCount = Math.max(0, Math.trunc(Number(get(row, iPages)) || 0));

    out.push({
      title,
      author,
      status,
      format: toFormat(get(row, iBinding)),
      pageCount,
      currentPage: status === "finished" ? pageCount : 0,
      rating: ratingNum > 0 ? ratingNum : null,
      isbn,
      coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null,
      finishDate: status === "finished" ? parseDate(get(row, iDateRead)) : null,
      dateAdded: parseDate(get(row, iDateAdded)) ?? new Date(),
    });
  }
  return out;
}
