import { relations } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["reading", "toread", "finished"]);
export const formatEnum = pgEnum("format", [
  "hardcover",
  "paperback",
  "ebook",
  "audiobook",
]);

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  series: text("series"),
  seriesNumber: integer("series_number"),
  status: statusEnum("status").notNull().default("toread"),
  pageCount: integer("page_count").notNull().default(0),
  currentPage: integer("current_page").notNull().default(0),
  rating: doublePrecision("rating"), // 0…5, half-steps; null = unrated
  format: formatEnum("format").notNull().default("hardcover"),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  language: text("language").notNull().default("English"),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  tone: text("tone"), // generated-cover tone key (carr / grey / thor)
  notes: text("notes").notNull().default(""),
  review: text("review").notNull().default(""),
  startDate: timestamp("start_date", { mode: "date" }),
  finishDate: timestamp("finish_date", { mode: "date" }),
  rereadCount: integer("reread_count").notNull().default(0),
  queueOrder: integer("queue_order").notNull().default(0),
  dateAdded: timestamp("date_added", { mode: "date" }).notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  page: integer("page"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const readingSessions = pgTable("reading_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull().defaultNow(),
  fromPage: integer("from_page").notNull().default(0),
  toPage: integer("to_page").notNull().default(0),
  pagesRead: integer("pages_read").notNull().default(0),
});

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const booksRelations = relations(books, ({ many }) => ({
  quotes: many(quotes),
  sessions: many(readingSessions),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  book: one(books, { fields: [quotes.bookId], references: [books.id] }),
}));

export const sessionsRelations = relations(readingSessions, ({ one }) => ({
  book: one(books, {
    fields: [readingSessions.bookId],
    references: [books.id],
  }),
}));
