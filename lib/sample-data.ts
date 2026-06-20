import type { BookWithRelations, Book, Quote, ReadingSession } from "./types";

const d = (s: string) => new Date(`${s}T12:00:00`);

// Deterministic, valid-format UUIDs so library links resolve to detail pages
// in the no-database fallback (random ids would change between renders).
const sid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type Seed = Partial<Book> &
  Pick<Book, "title" | "author" | "status"> & {
    quotes?: Array<Partial<Quote> & Pick<Quote, "text">>;
  };

const MS_DAY = 86_400_000;

/** The fields generateSessions needs — satisfied by both Seed and a DB Book. */
type SessionInput = Pick<
  Book,
  "title" | "status" | "startDate" | "finishDate" | "currentPage" | "pageCount"
> & { dateAdded?: Date | null };

export type GeneratedSession = Pick<
  ReadingSession,
  "date" | "fromPage" | "toPage" | "pagesRead"
>;

// Small deterministic PRNG so generated sessions are stable across renders and
// reseeds (keyed by title — the same book always yields the same history).
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noon(date: Date): Date {
  const c = new Date(date);
  c.setHours(12, 0, 0, 0);
  return c;
}

/**
 * Synthesize a plausible reading history for a book: a sparse set of days
 * between when it was started and finished (or today, if still reading) whose
 * page counts sum to the pages actually read. Returns nothing for "to read"
 * books. Deterministic per title.
 */
export function generateSessions(book: SessionInput): GeneratedSession[] {
  if (book.status === "toread") return [];
  const startBase = book.startDate ?? book.dateAdded;
  if (!startBase) return [];

  const start = noon(startBase);
  const endBase =
    book.status === "finished" ? book.finishDate ?? book.dateAdded : new Date();
  if (!endBase) return [];
  const end = noon(endBase);

  const target = book.status === "finished" ? book.pageCount : book.currentPage;
  if (end.getTime() < start.getTime() || target <= 0) return [];

  const rng = mulberry32(hashStr(book.title));

  // Read on roughly 60% of the days in the window.
  const days: Date[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += MS_DAY) {
    if (rng() < 0.6) days.push(new Date(t));
  }
  if (days.length === 0) days.push(new Date(start));

  const weights = days.map(() => 0.4 + rng());
  const wsum = weights.reduce((a, b) => a + b, 0);

  let cumulative = 0;
  const sessions: GeneratedSession[] = [];
  days.forEach((day, i) => {
    let pages =
      i === days.length - 1
        ? target - cumulative
        : Math.round((target * weights[i]) / wsum);
    pages = Math.min(pages, target - cumulative);
    if (pages <= 0) return;
    const fromPage = cumulative;
    cumulative += pages;
    sessions.push({ date: day, fromPage, toPage: cumulative, pagesRead: pages });
  });
  return sessions;
}

const SEEDS: Seed[] = [
  {
    title: "Red Sky Mourning",
    author: "Jack Carr",
    series: "Terminal List",
    seriesNumber: 7,
    tone: "carr",
    status: "reading",
    pageCount: 528,
    currentPage: 312,
    format: "hardcover",
    genres: ["Thriller", "Military", "Action"],
    startDate: d("2026-05-29"),
    dateAdded: d("2026-05-29"),
    notes:
      "Reece vs. an AI adversary — pacing is relentless. Picks up threads from In the Blood.",
    quotes: [
      {
        text: "The mission dictated the man, and the man had long ago accepted what the mission required.",
        page: 96,
        createdAt: d("2026-06-04"),
      },
      {
        text: "Hesitation was a luxury paid for in blood.",
        page: 211,
        createdAt: d("2026-06-08"),
      },
    ],
  },
  {
    title: "The Chaos Agent",
    author: "Mark Greaney",
    series: "Gray Man",
    seriesNumber: 13,
    tone: "grey",
    status: "reading",
    pageCount: 512,
    currentPage: 88,
    format: "audiobook",
    genres: ["Thriller", "Espionage", "Action"],
    startDate: d("2026-06-06"),
    dateAdded: d("2026-06-06"),
    notes: "Court and Zoya again. Robotics/AI arms-race plot. Listening on the commute.",
  },
  {
    title: "The Terminal List",
    author: "Jack Carr",
    series: "Terminal List",
    seriesNumber: 1,
    tone: "carr",
    status: "finished",
    pageCount: 416,
    currentPage: 416,
    format: "hardcover",
    rating: 4.5,
    genres: ["Thriller", "Military"],
    finishDate: d("2026-04-20"),
    dateAdded: d("2026-03-30"),
    review: "The one that started it. Brutal and propulsive — sets the bar for the series.",
  },
  {
    title: "Dark Sky",
    author: "C.J. Box",
    series: "Joe Pickett",
    seriesNumber: 21,
    tone: "thor",
    status: "finished",
    pageCount: 368,
    currentPage: 368,
    format: "ebook",
    rating: 4.0,
    genres: ["Thriller", "Mystery"],
    finishDate: d("2026-05-12"),
    dateAdded: d("2026-04-28"),
  },
  {
    title: "Mind of a Spy",
    author: "Andrew Bailey",
    tone: "grey",
    status: "toread",
    pageCount: 384,
    queueOrder: 0,
    genres: ["Espionage"],
    dateAdded: d("2026-06-01"),
  },
  {
    title: "The Last Ranger",
    author: "Peter Heller",
    tone: "thor",
    status: "toread",
    pageCount: 304,
    queueOrder: 1,
    genres: ["Mystery"],
    dateAdded: d("2026-06-03"),
  },
];

function materialize(seed: Seed, index: number): BookWithRelations {
  const id = sid(index + 1);
  const quotes: Quote[] = (seed.quotes ?? []).map((q, qi) => ({
    id: sid((index + 1) * 1000 + qi),
    bookId: id,
    text: q.text,
    page: q.page ?? null,
    createdAt: q.createdAt ?? new Date(),
  }));
  const sessions: ReadingSession[] = generateSessions({
    title: seed.title,
    status: seed.status,
    startDate: seed.startDate ?? null,
    finishDate: seed.finishDate ?? null,
    currentPage: seed.currentPage ?? 0,
    pageCount: seed.pageCount ?? 0,
    dateAdded: seed.dateAdded ?? new Date(),
  }).map((s, si) => ({
    id: sid((index + 1) * 2000 + si),
    bookId: id,
    ...s,
  }));

  return {
    id,
    userId: null,
    title: seed.title,
    author: seed.author,
    series: seed.series ?? null,
    seriesNumber: seed.seriesNumber ?? null,
    status: seed.status,
    pageCount: seed.pageCount ?? 0,
    currentPage: seed.currentPage ?? 0,
    rating: seed.rating ?? null,
    format: seed.format ?? "hardcover",
    genres: seed.genres ?? [],
    language: seed.language ?? "English",
    isbn: seed.isbn ?? null,
    coverUrl: seed.coverUrl ?? null,
    tone: seed.tone ?? null,
    notes: seed.notes ?? "",
    review: seed.review ?? "",
    startDate: seed.startDate ?? null,
    finishDate: seed.finishDate ?? null,
    rereadCount: seed.rereadCount ?? 0,
    queueOrder: seed.queueOrder ?? 0,
    dateAdded: seed.dateAdded ?? new Date(),
    quotes,
    sessions,
  };
}

/** Read-only sample library, used when no DATABASE_URL is configured. */
export const sampleBooks: BookWithRelations[] = SEEDS.map(materialize);
// (materialize receives the array index as its second arg from Array.map)

/** Plain seed rows for inserting into a real database (`npm run db:seed`). */
export const seedRows = SEEDS;
