import type { Book } from "./types";

/**
 * Export the library as a Goodreads-format CSV. This is the most portable
 * option: Goodreads and Hardcover (https://hardcover.app) both import Goodreads
 * exports, and our own importer round-trips it (see lib/goodreads.ts).
 */

// The standard Goodreads library-export columns, in order.
const COLUMNS = [
  "Book Id", "Title", "Author", "Author l-f", "Additional Authors",
  "ISBN", "ISBN13", "My Rating", "Average Rating", "Publisher", "Binding",
  "Number of Pages", "Year Published", "Original Publication Year",
  "Date Read", "Date Added", "Bookshelves", "Bookshelves with positions",
  "Exclusive Shelf", "My Review", "Spoiler", "Private Notes", "Read Count",
  "Owned Copies",
];

const SHELF: Record<Book["status"], string> = {
  finished: "read",
  reading: "currently-reading",
  toread: "to-read",
};

const BINDING: Record<Book["format"], string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
  ebook: "ebook",
  audiobook: "Audiobook",
};

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function gdDate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

// Goodreads wraps ISBNs in ="..." so spreadsheets don't mangle them.
function isbnCell(isbn: string): string {
  return `="${isbn}"`;
}

// "Jane Austen" -> "Austen, Jane" (Goodreads' Author l-f column).
function authorLastFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts.pop() as string;
  return `${last}, ${parts.join(" ")}`;
}

export function booksToGoodreadsCsv(books: Book[]): string {
  const rows = [COLUMNS.join(",")];

  for (const b of books) {
    const isbn10 = b.isbn && b.isbn.length === 10 ? isbnCell(b.isbn) : '=""';
    const isbn13 = b.isbn && b.isbn.length === 13 ? isbnCell(b.isbn) : '=""';

    const row = [
      "", // Book Id (Goodreads' own id; we have none)
      b.title,
      b.author,
      authorLastFirst(b.author),
      "", // Additional Authors
      isbn10,
      isbn13,
      b.rating != null ? String(Math.round(b.rating)) : "0", // Goodreads is whole-star
      "", // Average Rating
      "", // Publisher
      BINDING[b.format],
      b.pageCount ? String(b.pageCount) : "",
      "", // Year Published
      "", // Original Publication Year
      gdDate(b.finishDate),
      gdDate(b.dateAdded),
      b.genres.join(", "), // Bookshelves
      "", // Bookshelves with positions
      SHELF[b.status],
      b.review ?? "",
      "", // Spoiler
      b.notes ?? "", // Private Notes
      b.status === "finished" ? String(1 + (b.rereadCount ?? 0)) : "0",
      "", // Owned Copies
    ].map((v) => csvField(String(v)));

    rows.push(row.join(","));
  }

  return rows.join("\r\n") + "\r\n";
}
