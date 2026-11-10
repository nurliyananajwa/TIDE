type Destination = "Overview" | "Breakdowns" | "Funnels" | "Retention" | "Insights";

export function OceanMap({ onNavigate, visitors }: { onNavigate: (tab: Destination) => void; visitors: string }) {
  const stops: { name: string; detail: string; x: number; y: number; target: Destination }[] = [
    { name: "Discovery", detail: "Who arrives?", x: 16, y: 58, target: "Breakdowns" },
    { name: "Engagement", detail: "Where do they go?", x: 41, y: 43, target: "Funnels" },
    { name: "Conversion", detail: "What leads to action?", x: 65, y: 65, target: "Funnels" },
    { name: "Return", detail: "Who comes back?", x: 85, y: 34, target: "Retention" },
  ];
  return <section className="ocean-map" aria-labelledby="ocean-title">
    <svg className="atlas-drawing" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="nautical-grid" width="50" height="45" patternUnits="userSpaceOnUse"><path d="M50 0H0V45" fill="none" stroke="#8fe0df" strokeOpacity=".09" /></pattern>
        <linearGradient id="sea-depth" x2="1" y2="1"><stop stopColor="#163e51"/><stop offset="1" stopColor="#071f31"/></linearGradient>
        <radialGradient id="shallows"><stop stopColor="#388f91" stopOpacity=".25"/><stop offset="1" stopColor="#123344" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="1000" height="540" fill="url(#sea-depth)"/><rect width="1000" height="540" fill="url(#nautical-grid)"/>
      <ellipse cx="480" cy="310" rx="440" ry="240" fill="url(#shallows)"/>
      {[0,1,2,3,4,5].map(i=><g key={i} fill="none" stroke="#72c1be" strokeOpacity={.08+i*.016} strokeWidth="1">
        <path d="M-70 360 C60 210 50 450 210 360 S240 160 390 200 S520 330 620 220 S750 15 1070 120" transform={`translate(0 ${i*16})`}/>
        <path d="M-100 90 C120 200 120 -90 350 35 S700 160 1010 -40" transform={`translate(0 ${i*14})`}/>
      </g>)}
      <g fill="#264e58" stroke="#7ab6ad" strokeOpacity=".5">
        <path d="M-20 416 Q52 367 99 415 Q128 450 181 444 Q250 420 265 476 L292 550 H-20Z"/>
        <path d="M750 -15 Q724 20 762 54 Q788 79 842 64 Q896 40 919 81 Q956 113 1020 76 V-15Z"/>
        <path d="M510 109 Q527 90 548 103 Q566 121 550 135 Q524 147 510 127Z"/>
        <path d="M887 427 Q917 403 942 422 Q959 444 936 458 Q907 469 887 448Z"/>
      </g>
      <path d="M160 313 C270 313 300 232 410 232 S555 351 650 351 S760 184 850 184" fill="none" stroke="#75e0cf" strokeOpacity=".08" strokeWidth="26"/>
      <path d="M160 313 C270 313 300 232 410 232 S555 351 650 351 S760 184 850 184" fill="none" stroke="#8ce8d4" strokeWidth="2" strokeDasharray="5 8"/>
      <g transform="translate(935 105)" fill="none" stroke="#a7c9cc" strokeWidth="1"><circle r="27" strokeOpacity=".25"/><path d="M0 -22V22M-22 0H22" strokeOpacity=".4"/><path d="M0 -17L5 7L0 3L-5 7Z" fill="#9fdbd1"/><text y="-35" textAnchor="middle" fill="#9fbdc7" stroke="none" fontSize="10">N</text></g>
      <g fill="#87a9b5" fontSize="10" letterSpacing="3"><text x="50" y="502">THE ENGAGEMENT SEA</text><text x="640" y="70">RETURNING CURRENTS</text></g>
    </svg>
    <div className="map-intro"><span className="map-kicker">YOUR AUDIENCE, CHARTED</span><h2 id="ocean-title">Every visit.<br/><em>A new current.</em></h2><p>Follow the journey from first discovery<br/>to the next return.</p></div>
    <div className="map-stat"><span className="status-dot"/> ACTIVE VISITORS<strong>{visitors}</strong><small>Illustrative demo · selected period</small></div>
    {stops.map((stop,i)=><button className={`map-stop stop-${i}`} key={stop.name} style={{left:stop.x+"%",top:stop.y+"%"}} onClick={()=>onNavigate(stop.target)} aria-label={`Explore ${stop.name}: ${stop.detail}`}><span className="map-buoy"><span>{String(i+1).padStart(2,"0")}</span></span><strong>{stop.name}</strong><small>{stop.detail}</small></button>)}
    <div className="map-footer"><span>01 — 04 / VISITOR JOURNEY</span><span>Conceptual map · select a waypoint to explore ↗</span></div>
  </section>;
}

export function CoastalWelcome({onNavigate}:{onNavigate:(tab:Destination)=>void}) {
  return <section className="coastal-welcome"><div><span className="map-kicker">A LITTLE CLARITY, EVERY DAY</span><h2>Good things come<br/>in <em>tides.</em></h2><p>Find the patterns. Follow the possibilities.</p><button onClick={()=>onNavigate("Insights")}>Discover your insights <span>↗</span></button></div><svg viewBox="0 0 600 290" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="408" cy="80" r="42" fill="#f1c995"/><path d="M0 160Q100 90 200 155T400 155T600 150V300H0Z" fill="#c4e4da"/><path d="M0 197Q100 132 215 190T430 195T650 175V300H0Z" fill="#8dc9ba"/><path d="M0 232Q110 173 225 225T440 235T650 210V300H0Z" fill="#4caa98"/><path d="M0 263Q110 215 230 259T450 267T650 250V300H0Z" fill="#167a6b"/><path d="M350 157l33 -13l-5 24Z" fill="#fff9eb"/><path d="M376 139v24" stroke="#468776" strokeWidth="2"/></svg><span className="coast-caption">FRESH PERSPECTIVES / DEMO WORKSPACE</span></section>;
}
