import type { books, quotes, readingSessions } from "./db/schema";

export type Book = typeof books.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type ReadingSession = typeof readingSessions.$inferSelect;

export type BookWithRelations = Book & {
  quotes: Quote[];
  sessions: ReadingSession[];
};

export type ReadingStatus = Book["status"]; // "reading" | "toread" | "finished"
export type BookFormat = Book["format"];

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  reading: "Currently Reading",
  toread: "Up Next",
  finished: "Finished",
};

export const FORMAT_LABELS: Record<BookFormat, string> = {
  hardcover: "Hardcover",
  paperback: "Paperback",
  ebook: "eBook",
  audiobook: "Audiobook",
};

export function progress(book: Pick<Book, "currentPage" | "pageCount">): number {
  return book.pageCount > 0 ? book.currentPage / book.pageCount : 0;
}
