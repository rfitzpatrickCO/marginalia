import { getStats } from "@/lib/stats";
import { Heatmap } from "@/components/Heatmap";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await requireAuth();
  const s = await getStats();

  const cards: Array<{ num: string; unit?: string; label: string }> = [
    { num: String(s.booksThisYear), label: `Books in ${s.year}` },
    { num: s.pagesThisYear.toLocaleString(), label: `Pages in ${s.year}` },
    {
      num: String(s.currentStreak),
      unit: s.currentStreak === 1 ? "day" : "days",
      label: "Current streak",
    },
    { num: String(s.currentlyReading), label: "Currently reading" },
  ];

  return (
    <main className="scroll">
      <h1 className="large-title">Stats</h1>

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className="stat-num">
              {c.num}
              {c.unit ? <span className="unit">{c.unit}</span> : null}
            </div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">Reading activity</div>
      <Heatmap weeks={s.weeks} monthLabels={s.monthLabels} />
      <div className="heat-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span
            className="heat-cell"
            key={l}
            style={{ background: `var(--heat-${l})` }}
          />
        ))}
        <span>More</span>
      </div>
      <div className="section-footer">
        Longest streak {s.longestStreak} day{s.longestStreak === 1 ? "" : "s"} ·{" "}
        {s.finishedAllTime} book{s.finishedAllTime === 1 ? "" : "s"} finished
        all-time.
      </div>
    </main>
  );
}
