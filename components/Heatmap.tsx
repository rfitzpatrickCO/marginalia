import type { HeatCell, MonthLabel } from "@/lib/stats";
import { HeatScroll } from "./HeatScroll";

/** GitHub-style contribution grid: week-columns of day cells, shaded by pages
 *  read. Horizontally scrollable on narrow screens. */
export function Heatmap({
  weeks,
  monthLabels,
}: {
  weeks: HeatCell[][];
  monthLabels: MonthLabel[];
}) {
  const labelByColumn = new Map(monthLabels.map((m) => [m.column, m.label]));

  return (
    <HeatScroll>
      <div className="heatmap">
        <div className="heat-months">
          {weeks.map((_, i) => (
            <div className="heat-col-label" key={i}>
              {labelByColumn.get(i) ?? ""}
            </div>
          ))}
        </div>
        <div className="heat-grid">
          {weeks.map((week, i) => (
            <div className="heat-col" key={i}>
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className="heat-cell"
                  style={{ background: `var(--heat-${cell.level})` }}
                  title={`${cell.date}: ${cell.pages} page${cell.pages === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </HeatScroll>
  );
}
