"use client";

import Link from "next/link";
import { useState } from "react";
import { fmt } from "@/lib/format";

// The one decorative ocean moment: a way to jump to the report for each journey stage.
// Island shapes and positions are illustration only; the numbers are passed in.
const islandA = "M-70 72C12 10 98 50 137 118S250 98 277 161S243 251 295 304S338 414 271 470S130 455 94 506S18 577-60 564Z";
const islandB = "M646-80C607-10 708 37 682 96S569 132 611 204S714 202 760 258S865 295 890 215S1000 188 1060 231V-80Z";
const islandC = "M429 398C473 346 518 357 545 402S631 411 652 469S610 556 557 543S521 593 461 559S381 482 429 398Z";

export type JourneyStop = { name: string; value: number; unit: string; x: number; y: number; copy: string; href: string; linkLabel: string };

export function JourneyMap({ stops }: { stops: JourneyStop[] }) {
  const [active, setActive] = useState(0);
  const s = stops[active];
  return (
    <section className="tc-journey" aria-label="Explore by journey stage">
      <header className="tc-card-head"><div><h3>Explore by journey stage</h3><p>Choose a stop to open the report for that stage. The map is decorative; it doesn&apos;t encode data.</p></div></header>
      <div className="expedition">
        <div className="map-terrain">
          <svg viewBox="0 0 1000 650" preserveAspectRatio="none" className="terrain-svg" aria-hidden="true"><defs>
            <pattern id="atlas-grid-v2" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#7da99f" strokeOpacity=".12" /></pattern>
            <pattern id="atlas-dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" fill="#a5c6ab" fillOpacity=".14" /></pattern>
            <filter id="coast-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="9" stdDeviation="12" floodColor="#020e16" floodOpacity=".6" /></filter>
          </defs><rect width="1000" height="650" fill="url(#atlas-grid-v2)" />
            {[islandA, islandB, islandC].map((d, i) => <g key={i}>
              {[40, 30, 20, 10].map((w) => <path key={w} d={d} fill="none" stroke="#f5ffe9" strokeWidth={w} strokeOpacity=".32" />)}
              <path d={d} fill="#e6dcb4" stroke="#f6fff0" strokeWidth="1.2" filter="url(#coast-shadow)" />
              <path d={d} fill="url(#atlas-dots)" opacity=".3" />
            </g>)}
            <path className="journey-route" d="M270 201C340 200 331 312 490 312S600 240 740 240S740 480 600 500" fill="none" stroke="#b9ffef" strokeWidth="2" strokeDasharray="4 7" />
          </svg>
          {stops.map((d, i) => <button key={d.name} className={`expedition-stop ${active === i ? "chosen" : ""}`} style={{ left: d.x + "%", top: d.y + "%" }} onClick={() => setActive(i)} aria-pressed={active === i} aria-label={`${d.name}: ${fmt(d.value)} ${d.unit}`}><span className="expedition-marker"><i />{String(i + 1).padStart(2, "0")}</span><span className="expedition-label"><strong>{d.name}</strong><small>{fmt(d.value)} {d.unit}</small></span></button>)}
        </div>
      </div>
      <div className="tc-journey-detail" aria-live="polite">
        <div>
          <h3>{s.name}</h3>
          <p>{fmt(s.value)} {s.unit}</p>
        </div>
        <p>{s.copy}</p>
        <Link href={s.href}>{s.linkLabel} <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
