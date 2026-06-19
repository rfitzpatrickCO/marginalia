import { getBooks } from "./books";

const MS_DAY = 86_400_000;

export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export type HeatCell = { date: string; pages: number; level: HeatLevel };
export type MonthLabel = { column: number; label: string };

export type Stats = {
  year: number;
  booksThisYear: number;
  pagesThisYear: number;
  currentlyReading: number;
  finishedAllTime: number;
  currentStreak: number;
  longestStreak: number;
  /** Heatmap as week-columns (Sunday → Saturday), oldest column first. */
  weeks: HeatCell[][];
  monthLabels: MonthLabel[];
};

// Pages-read-per-day thresholds for the five heatmap shades.
function heatLevel(pages: number): HeatLevel {
  if (pages <= 0) return 0;
  if (pages <= 10) return 1;
  if (pages <= 25) return 2;
  if (pages <= 45) return 3;
  return 4;
}

function dayKey(date: Date): string {
  const c = new Date(date);
  c.setHours(12, 0, 0, 0);
  return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}-${String(
    c.getDate(),
  ).padStart(2, "0")}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Aggregate reading stats from the library. ~53 weeks of heatmap ending today. */
export async function getStats(): Promise<Stats> {
  const books = await getBooks();
  const now = new Date();
  const year = now.getFullYear();

  const pagesByDay = new Map<string, number>();
  let pagesThisYear = 0;
  for (const book of books) {
    for (const s of book.sessions) {
      const date = new Date(s.date);
      const key = dayKey(date);
      pagesByDay.set(key, (pagesByDay.get(key) ?? 0) + s.pagesRead);
      if (date.getFullYear() === year) pagesThisYear += s.pagesRead;
    }
  }

  const booksThisYear = books.filter(
    (b) => b.status === "finished" && b.finishDate?.getFullYear() === year,
  ).length;
  const currentlyReading = books.filter((b) => b.status === "reading").length;
  const finishedAllTime = books.filter((b) => b.status === "finished").length;

  const { currentStreak, longestStreak } = computeStreaks(pagesByDay, now);
  const { weeks, monthLabels } = buildHeatmap(pagesByDay, now);

  return {
    year,
    booksThisYear,
    pagesThisYear,
    currentlyReading,
    finishedAllTime,
    currentStreak,
    longestStreak,
    weeks,
    monthLabels,
  };
}

function computeStreaks(
  pagesByDay: Map<string, number>,
  now: Date,
): { currentStreak: number; longestStreak: number } {
  const activeDays = new Set(
    [...pagesByDay.entries()].filter(([, p]) => p > 0).map(([k]) => k),
  );

  // Current streak: count back from today (a page-free today doesn't break a
  // streak that ran through yesterday).
  let currentStreak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!activeDays.has(dayKey(cursor))) cursor.setTime(cursor.getTime() - MS_DAY);
  while (activeDays.has(dayKey(cursor))) {
    currentStreak++;
    cursor.setTime(cursor.getTime() - MS_DAY);
  }

  // Longest streak over all active days.
  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const key of [...activeDays].sort()) {
    const t = new Date(`${key}T12:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / MS_DAY) === 1 ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = t;
  }

  return { currentStreak, longestStreak };
}

function buildHeatmap(
  pagesByDay: Map<string, number>,
  now: Date,
): { weeks: HeatCell[][]; monthLabels: MonthLabel[] } {
  const end = new Date(now);
  end.setHours(12, 0, 0, 0);
  // Start ~52 weeks back, snapped to the start of that week (Sunday).
  const start = new Date(end.getTime() - 363 * MS_DAY);
  start.setDate(start.getDate() - start.getDay());

  const weeks: HeatCell[][] = [];
  const monthLabels: MonthLabel[] = [];
  let current: HeatCell[] = [];
  let lastMonth = -1;

  for (let t = start.getTime(); t <= end.getTime(); t += MS_DAY) {
    const date = new Date(t);
    if (date.getDay() === 0 && current.length) {
      weeks.push(current);
      current = [];
    }
    if (current.length === 0) {
      // New column: label it if it opens a new month.
      const month = date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ column: weeks.length, label: MONTHS[month] });
        lastMonth = month;
      }
    }
    const key = dayKey(date);
    const pages = pagesByDay.get(key) ?? 0;
    current.push({ date: key, pages, level: heatLevel(pages) });
  }
  if (current.length) weeks.push(current);

  return { weeks, monthLabels };
}
