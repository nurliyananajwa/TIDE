import Link from "next/link";
import type { ReactNode } from "react";

/** The one-sentence answer that opens every report. */
export function Answer({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return <section className="tc-answer" aria-label="Summary"><p>{children}</p>{note && <small>{note}</small>}</section>;
}

export function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="tc-card">
      <header className="tc-card-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
      {children}
    </section>
  );
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="tc-link" href={href}>{children} <span aria-hidden="true">→</span></Link>;
}

/** Change against the previous month: relative % for counts, percentage points for rates. */
export function Delta({ now, before, kind, label }: { now: number; before: number | undefined; kind: "count" | "rate"; label: string | null }) {
  if (before === undefined || label === null) return <span className="tc-delta is-flat">No earlier month to compare</span>;
  const diff = kind === "count" ? (now - before) / before : (now - before) * 100;
  const text = kind === "count" ? `${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(1)}%` : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} pts`;
  return <span className={`tc-delta ${diff > 0.0005 ? "is-up" : diff < -0.0005 ? "is-down" : "is-flat"}`}>{diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {text} <small>vs {label}</small></span>;
}
