"use client";

import { useState } from "react";
import { fmt, longDate, shortDate } from "@/lib/format";
import type { Cohort } from "@/lib/view";

function heat(value: number | undefined) {
  if (value === undefined) return { background: "transparent", color: "var(--tc-muted)", border: "1px dashed var(--tc-line)" };
  if (value === 100) return { background: "rgba(127,224,212,.16)", color: "var(--tc-muted)" };
  const strength = Math.min(1, value / 32);
  return { background: `rgba(127,224,212,${0.1 + strength * 0.65})`, color: strength > 0.6 ? "#04293b" : "var(--tc-text)" };
}

/** Cohort table: one row per weekly cohort, darker = more visitors came back that week. Select a cell to read it in words. */
export function CohortExplorer({ cohorts }: { cohorts: Cohort[] }) {
  const [selected, onSelect] = useState<[number, number]>([0, 1]);
  const c = cohorts[selected[0]], v = c.weeks[selected[1]];
  return (
    <>
    <div className="tc-table-scroll">
      <table className="tc-cohorts">
        <thead><tr><th scope="col">First visit (week of)</th><th scope="col" className="num">New visitors</th>{Array.from({ length: 7 }, (_, w) => <th key={w} scope="col" className="num">Week {w}</th>)}</tr></thead>
        <tbody>
          {cohorts.map((c, i) => (
            <tr key={c.start}>
              <th scope="row">{shortDate(c.start)} {c.start.slice(0, 4)}</th>
              <td className="num">{fmt(c.size)}</td>
              {Array.from({ length: 7 }, (_, w) => {
                const v = c.weeks[w];
                const on = selected[0] === i && selected[1] === w;
                return (
                  <td key={w}>
                    <button style={heat(v)} className={on ? "is-selected" : ""} aria-pressed={on} disabled={v === undefined}
                      aria-label={v === undefined ? `Week ${w}: not observed yet` : `Cohort ${shortDate(c.start)}, week ${w}: ${v}%`}
                      onClick={() => onSelect([i, w])}>{v === undefined ? "–" : `${v}%`}</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <p className="tc-reading" aria-live="polite">
        Of the {fmt(c.size)} people who first visited in the week of {longDate(c.start)}, <strong>{v}%</strong> {selected[1] === 0 ? "visited in their first week (by definition, everyone)" : `visited again in week ${selected[1]}`}.
      </p>
    </>
  );
}
