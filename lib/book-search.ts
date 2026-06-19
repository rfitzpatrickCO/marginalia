/**
 * Book metadata lookup for the "add a book" flow.
 *
 * Tries Google Books first (cleaner genre categories and page counts), then
 * falls back to Open Library, which needs no API key and rate-limits far less
 * aggressively. Both are queried server-side, so there's no CORS or
 * key-exposure concern. Covers prefer Open Library's larger art.
 *
 * Set GOOGLE_BOOKS_API_KEY to lift Google's per-IP quota (it 429s easily from
 * shared/datacenter IPs); the lookup still works without it via the fallback.
 */

export type BookSearchResult = {
  title: string;
  author: string;
  pageCount: number;
  genres: string[];
  isbn: string | null;
  coverUrl: string | null;
  publishedYear: number | null;
};

const TIMEOUT_MS = 8000;

function dedupeCap(values: string[], cap = 4): string[] {
  const out: string[] = [];
  for (const v of values) {
    if (out.length >= cap) break;
    if (!out.some((o) => o.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
}

// ---------- Google Books ----------

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    categories?: string[];
    publishedDate?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: { thumbnail?: string };
  };
};

function googleIsbn(vol: GoogleVolume): string | null {
  const ids = vol.volumeInfo?.industryIdentifiers ?? [];
  return (
    ids.find((i) => i.type === "ISBN_13")?.identifier ??
    ids.find((i) => i.type === "ISBN_10")?.identifier ??
    null
  );
}

function googleGenres(categories: string[] | undefined): string[] {
  if (!categories) return [];
  // Categories look like "Fiction / Thrillers / Suspense".
  const parts = categories.flatMap((c) => c.split("/").map((s) => s.trim()));
  return dedupeCap(parts.filter(Boolean));
}

function mapGoogle(vol: GoogleVolume): BookSearchResult | null {
  const info = vol.volumeInfo;
  if (!info?.title) return null;
  const isbn = googleIsbn(vol);
  const thumb = info.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null;
  return {
    title: info.title,
    author: info.authors?.join(", ") ?? "",
    pageCount: info.pageCount ?? 0,
    genres: googleGenres(info.categories),
    isbn,
    coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : thumb,
    publishedYear: info.publishedDate
      ? Number(info.publishedDate.slice(0, 4)) || null
      : null,
  };
}

async function searchGoogle(query: string): Promise<BookSearchResult[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url =
    "https://www.googleapis.com/books/v1/volumes?printType=books&maxResults=8&q=" +
    encodeURIComponent(query) +
    (key ? `&key=${key}` : "");
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const data = (await res.json()) as { items?: GoogleVolume[] };
  return (data.items ?? [])
    .map(mapGoogle)
    .filter((r): r is BookSearchResult => r !== null);
}

// ---------- Open Library ----------

type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  subject?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

// Open Library subjects are noisy; drop the obvious cataloguing junk.
const SUBJECT_DENY = [
  "large type",
  "audiobook",
  "reading level",
  "accessible book",
  "protected daisy",
  "in library",
  "overdrive",
  "bestseller",
];

function openLibraryGenres(subjects: string[] | undefined): string[] {
  if (!subjects) return [];
  const kept = subjects.filter((s) => {
    const t = s.trim();
    if (!t || /[:=]/.test(t) || /\d/.test(t)) return false;
    if (t.length > 24 || t.split(" ").length > 3) return false;
    return !SUBJECT_DENY.some((d) => t.toLowerCase().includes(d));
  });
  return dedupeCap(kept.map((s) => s.trim()));
}

function mapOpenLibrary(doc: OpenLibraryDoc): BookSearchResult | null {
  if (!doc.title) return null;
  const isbn = doc.isbn?.[0] ?? null;
  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : isbn
      ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      : null;
  return {
    title: doc.title,
    author: doc.author_name?.[0] ?? "",
    pageCount: doc.number_of_pages_median ?? 0,
    genres: openLibraryGenres(doc.subject),
    isbn,
    coverUrl,
    publishedYear: doc.first_publish_year ?? null,
  };
}

async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const fields =
    "title,author_name,isbn,number_of_pages_median,subject,first_publish_year,cover_i";
  const url =
    "https://openlibrary.org/search.json?limit=8&fields=" +
    fields +
    "&q=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  return (data.docs ?? [])
    .map(mapOpenLibrary)
    .filter((r): r is BookSearchResult => r !== null);
}

/** Search for book metadata. Google Books first, Open Library as a fallback.
 *  Best-effort: returns [] rather than throwing if both sources fail. */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const google = await searchGoogle(q);
    if (google.length > 0) return google;
  } catch {
    // fall through to Open Library
  }

  try {
    return await searchOpenLibrary(q);
  } catch {
    return [];
  }
}
