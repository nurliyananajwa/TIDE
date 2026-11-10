"use client";

import { useState } from "react";

type Report = "Overview" | "Breakdowns" | "Funnels" | "Retention" | "Insights";
type Props = { design: "coastal" | "atlas"; scale: number; device: string; onNavigate: (report: Report) => void };
const series = [30, 34, 26, 40, 35, 54, 42, 59, 48, 70, 63, 79, 68, 85, 74, 91, 82];

function FlowChart({ interval, scale }: { interval: string; scale: number }) {
  const data = interval === "Week" ? [36, 52, 64, 83] : series;
  const points = data.map((value, i) => [i * 700 / (data.length - 1), 175 - value * 1.55]);
  const curve = points.reduce((s, p, i) => i === 0 ? `M${p[0]} ${p[1]}` : `${s} C${(p[0] + points[i-1][0])/2} ${points[i-1][1]} ${(p[0] + points[i-1][0])/2} ${p[1]} ${p[0]} ${p[1]}`, "");
  return <svg className="studio-flow" viewBox="0 0 700 200" preserveAspectRatio="none" role="img" aria-label={`Illustrative visitor activity by ${interval.toLowerCase()}`}>
    <defs><linearGradient id="studio-wash" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a5eef0" stopOpacity=".6"/><stop offset="1" stopColor="#a5eef0" stopOpacity="0"/></linearGradient></defs>
    {[40,95,150].map(y=><path key={y} d={`M0 ${y}H700`} stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 6"/>)}
    <path d={curve+" L700 200 H0Z"} fill="url(#studio-wash)"/><path d={curve} fill="none" stroke="#e8ffff" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
    <path d="M0 165 C90 130 100 180 180 140S300 170 360 115S480 150 540 100S650 125 700 90" fill="none" stroke="#8caebc" strokeWidth="1.5" strokeDasharray="4 7"/>
    {points.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="5" fill="#062b43" stroke="#d3ffff" strokeWidth="2"><title>{`${Math.round(data[i]*10*scale)} demo visitors`}</title></circle>)}
  </svg>;
}

const islandA = "M-70 72C12 10 98 50 137 118S250 98 277 161S243 251 295 304S338 414 271 470S130 455 94 506S18 577-60 564Z";
const islandB = "M646-80C607-10 708 37 682 96S569 132 611 204S714 202 760 258S865 295 890 215S1000 188 1060 231V-80Z";
const islandC = "M429 398C473 346 518 357 545 402S631 411 652 469S610 556 557 543S521 593 461 559S381 482 429 398Z";
const destinations = [
  { name:"Discovery", subtitle:"First impressions", x:27, y:31, value:12000, unit:"visitors", metric:"+12.8%", copy:"Your audience is growing. Explore where these visitors come from.", report:"Breakdowns" as Report },
  { name:"Engagement", subtitle:"The exploration", x:49, y:48, value:8400, unit:"product viewers", metric:"70.0%", copy:"Seven in ten demo visitors explored a product. Follow their next step.", report:"Funnels" as Report },
  { name:"Conversion", subtitle:"The destination", x:74, y:37, value:504, unit:"purchasers", metric:"4.2%", copy:"Compare the paths that turn curiosity into a completed purchase.", report:"Funnels" as Report },
  { name:"Return", subtitle:"A familiar shore", x:60, y:77, value:3240, unit:"returning visitors", metric:"27.0%", copy:"A return visit is a new opportunity. Explore weekly visitor cohorts.", report:"Retention" as Report },
];

export default function OverviewStudio({design,scale,device,onNavigate}:Props) {
  const [interval,setInterval] = useState("Day");
  const [active,setActive] = useState(0);
  const [layer,setLayer] = useState("Visitors");
  const [zoom,setZoom] = useState(1);
  const [isKeyOpen,setIsKeyOpen] = useState(false);
  const number = (value:number) => Math.round(value*scale).toLocaleString();
  const selected = destinations[active];
  const conversion = device === "Mobile" ? "2.6" : device === "Desktop" ? "4.8" : device === "Tablet" ? "3.1" : "4.2";
  if (design === "atlas") return <div className="atlas-studio">
    <div className="atlas-titleline"><div><span className="studio-overline">TIDE EXPEDITION / 001</span><h2>Follow the <em>current.</em></h2></div><p>A new perspective on your audience.<br/><span>Conceptual journey map · illustrative data</span></p></div>
    <section className="expedition" aria-label="Interactive audience journey map">
      <div className="map-layerbar" role="group" aria-label="Map data layer">{["Visitors","Conversion","Retention"].map(item=><button key={item} aria-pressed={layer===item} onClick={()=>setLayer(item)}>{item}</button>)}</div>
      <div className="map-terrain" style={{transform:`scale(${zoom})`}}>
        <svg viewBox="0 0 1000 650" preserveAspectRatio="none" className="terrain-svg" aria-hidden="true"><defs>
          <pattern id="atlas-grid-v2" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#7da99f" strokeOpacity=".12"/></pattern>
          <pattern id="atlas-dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".8" fill="#a5c6ab" fillOpacity=".14"/></pattern>
          <radialGradient id="atlas-water"><stop stopColor="#214c51"/><stop offset="1" stopColor="#102c37"/></radialGradient>
          <linearGradient id="terrain-land" x2="1" y2="1"><stop stopColor="#617568"/><stop offset=".55" stopColor="#364e46"/><stop offset="1" stopColor="#263e39"/></linearGradient>
          <filter id="coast-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="9" stdDeviation="12" floodColor="#020e16" floodOpacity=".6"/></filter>
        </defs><rect width="1000" height="650" fill="url(#atlas-water)"/><rect width="1000" height="650" fill="url(#atlas-grid-v2)"/>
          {[islandA,islandB,islandC].map((d,i)=><g key={i}>
            {[40,30,20,10].map(w=><path key={w} d={d} fill="none" stroke="#98cbb4" strokeWidth={w} strokeOpacity=".035"/>)}
            <path d={d} fill="url(#terrain-land)" stroke="#98b499" strokeWidth="1.2" filter="url(#coast-shadow)"/>
            <path d={d} fill="url(#atlas-dots)"/>
            {[.9,.8,.7,.6,.5].map((s,j)=><path key={s} d={d} transform={`translate(${i===0?80*(1-s):i===1?820*(1-s):520*(1-s)} ${i===0?280*(1-s):i===1?90*(1-s):470*(1-s)}) scale(${s})`} fill="none" stroke="#d6d7a3" strokeOpacity={.15-j*.018} strokeWidth="1"/>)}
          </g>)}
          <g fill="#b4c9b3" fontFamily="monospace" fontSize="10" letterSpacing="4" opacity=".65"><text x="33" y="321" transform="rotate(-22 33 321)">DISCOVERY COAST</text><text x="715" y="106">CONVERSION ISLES</text><text x="440" y="535" transform="rotate(12 440 535)">RETURNING SHORES</text><text x="350" y="240" fill="#79a7a9" fontSize="12">THE ENGAGEMENT SEA</text></g>
          <path d="M270 201C340 200 331 312 490 312S600 240 740 240S740 480 600 500" fill="none" stroke="#d5e49a" strokeOpacity=".08" strokeWidth="28"/>
          <path className="journey-route" d="M270 201C340 200 331 312 490 312S600 240 740 240S740 480 600 500" fill="none" stroke={layer==="Conversion"?"#f0b18f":layer==="Retention"?"#96d4e5":"#d5e49a"} strokeWidth="2" strokeDasharray="4 7"/>
          <g transform="translate(895 500)" stroke="#cbd8ba" fill="none" opacity=".65"><circle r="42" strokeWidth=".6"/><circle r="34" strokeWidth=".4"/>{[0,45,90,135].map(a=><path key={a} d="M0 -42V42" transform={`rotate(${a})`} strokeWidth=".6"/>)}<path d="M0 -30L8 18L0 10L-8 18Z" fill="#cad8b7"/><text y="-52" fill="#cad8b7" stroke="none" textAnchor="middle" fontSize="11">N</text></g>
        </svg>
        {destinations.map((d,i)=><button key={d.name} className={`expedition-stop ${active===i?"chosen":""}`} style={{left:d.x+"%",top:d.y+"%"}} onClick={()=>setActive(i)} aria-pressed={active===i} aria-label={`Inspect ${d.name}`}><span className="expedition-marker"><i/>{String(i+1).padStart(2,"0")}</span><span className="expedition-label"><strong>{d.name}</strong><small>{layer==="Visitors"?number(d.value):layer==="Conversion"?["4.2%","6.0%","100%","3.5%"][i]:["27%","24%","31%","100%"][i]} {layer==="Visitors"?d.unit:layer.toLowerCase()}</small></span></button>)}
      </div>
      <div className="map-coordinates"><span>35° 42′ N</span><span>EXPLORATION MODE</span><span>139° 46′ E</span></div>
      <div className="expedition-detail" aria-live="polite"><div className="detail-index">0{active+1}<span>{selected.subtitle}</span></div><h3>{selected.name}</h3><div className="detail-number">{number(selected.value)}<small>{selected.unit}</small></div><p>{selected.copy}</p><button onClick={()=>onNavigate(selected.report)}>Open {selected.report.toLowerCase()} <span>↗</span></button></div>
      <div className="map-tools"><button aria-label="Zoom in" disabled={zoom>=1.4} onClick={()=>setZoom(Math.min(1.4,zoom+.2))}>+</button><button aria-label="Zoom out" disabled={zoom<=1} onClick={()=>setZoom(Math.max(1,zoom-.2))}>−</button><button aria-label="Reset map view" onClick={()=>{setZoom(1);setActive(0)}}>⌖</button></div>
      <div className="atlas-map-key"><button onClick={()=>setIsKeyOpen(!isKeyOpen)} aria-expanded={isKeyOpen}>⌁ Map key</button>{isKeyOpen&&<p>Numbered locations represent journey stages. Dotted lines connect the stages. Geography and layer values are illustrative.</p>}</div>
      <div className="map-scale">0 ━━━━━ 100<span>JOURNEY UNITS / CONCEPT MAP</span></div>
    </section>
    <div className="expedition-dock">{[["TOTAL VISITORS",number(12000),"+12.8%"],["SESSIONS",number(18640),"+8.2%"],["CONVERSION",conversion+"%","+0.6 pp"],["RETURNING",number(3240),"+5.4%"]].map(([label,value,change],i)=><button key={label} onClick={()=>onNavigate((["Breakdowns","Overview","Funnels","Retention"] as Report[])[i])}><span>{label}</span><strong>{value}</strong><small>{change} <span>↗</span></small></button>)}</div>
  </div>;

  return <div className="bento-studio">
    <div className="studio-headline"><div><span className="studio-overline">A FRESH PERSPECTIVE / MERCHANDISE STORE</span><h2>Small signals.<br/><em>Deeper possibilities.</em></h2></div><div className="edition-stamp"><span>THE DAILY</span><strong>tide report</strong><span>VOL. 001 / DEMO EDITION</span></div></div>
    <div className="studio-bento-grid">
      <section className="studio-card audience-card"><div className="studio-card-label"><span>01 / YOUR AUDIENCE</span><button aria-label="Explore audience breakdowns" onClick={()=>onNavigate("Breakdowns")}>↗</button></div><div className="audience-number">{number(12000)}<span>visitors finding<br/>their way to you.</span></div><div className="audience-bottom"><span className="studio-pill">↗ 12.8%</span><span>vs. previous period</span><svg viewBox="0 0 140 40" aria-hidden="true"><path d="M0 35L12 24L22 28L35 10L48 18L60 15L72 22L84 9L96 12L110 3L125 11L140 0" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div></section>
      <section className="studio-card activity-card"><div className="studio-card-label"><span>02 / VISITOR ACTIVITY</span><div role="group" aria-label="Activity interval">{["Day","Week"].map(v=><button key={v} className={interval===v?"interval-active":""} aria-pressed={interval===v} onClick={()=>setInterval(v)}>{v}</button>)}</div></div><div className="activity-heading"><h3>A rising tide.</h3><span><i/> Current period <b>┄ Previous</b></span></div><FlowChart interval={interval} scale={scale}/><div className="flow-axis"><span>START OF PERIOD</span><span>ILLUSTRATIVE VISITOR TREND</span><span>TODAY</span></div></section>
      <section className="studio-card conversion-card"><div className="studio-card-label"><span>03 / CONVERSION</span><button aria-label="Explore conversion funnel" onClick={()=>onNavigate("Funnels")}>↗</button></div><div className="conversion-dial"><svg viewBox="0 0 230 135" aria-hidden="true"><path d="M25 115A90 90 0 0 1 205 115" fill="none" stroke="#e4b795" strokeWidth="13" strokeDasharray="2 5"/><path d="M25 115A90 90 0 0 1 145 30" fill="none" stroke="#723c2d" strokeWidth="13" strokeDasharray="2 5"/></svg><strong>{conversion}<span>%</span></strong></div><h3>Curiosity becomes action.</h3><p><b>+0.6 pp</b> vs. previous period</p></section>
      <section className="studio-card currents-card"><div className="studio-card-label"><span>04 / ACQUISITION CURRENTS</span><button aria-label="Compare acquisition sources" onClick={()=>onNavigate("Breakdowns")}>↗</button></div><h3>All paths lead somewhere.</h3><div className="current-streams">{[["Organic search","57",number(6840)],["Direct","37",number(4440)],["Referral","6",number(720)]].map(([label,width,value],i)=><div key={label}><span>0{i+1}</span><strong>{label}</strong><div><i style={{width:width+"%"}}/></div><b>{value}</b></div>)}</div><small>Illustrative traffic mix · selected period</small></section>
      <section className="studio-card return-card"><div className="studio-card-label"><span>05 / RETURNING VISITORS</span><button aria-label="Explore visitor retention" onClick={()=>onNavigate("Retention")}>↗</button></div><div className="return-orbit" aria-hidden="true"><i/><i/><i/><span>↻</span></div><strong>{number(3240)}</strong><h3>Some journeys<br/>come full circle.</h3><span className="return-growth">↗ 5.4% vs. previous period</span></section>
      <button className="studio-card story-card" onClick={()=>onNavigate("Insights")}><span className="studio-card-label">THE STORY BENEATH THE SURFACE <b>↗</b></span><h3>What makes a<br/>visitor <em>stay?</em></h3><span className="story-link">Explore 3 sample insights <b>→</b></span><svg viewBox="0 0 300 300" aria-hidden="true">{Array.from({length:12},(_,i)=><ellipse key={i} cx="260" cy="170" rx={30+i*17} ry={20+i*12} fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-35 260 170)"/>)}</svg></button>
    </div>
    <div className="studio-footnote"><span>DESIGNED TO FIND THE SIGNAL.</span><span>All values are illustrative. Your real story comes next.</span></div>
  </div>;
}
