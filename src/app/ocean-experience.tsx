import type { ReactNode } from "react";

type Report = "Overview" | "Breakdowns" | "Funnels" | "Retention" | "Insights";
const chapters: Record<Report,{lead:string;italic:string;line:string;number:string}> = {
  Overview:{lead:"An ocean of",italic:"possibility.",line:"See the currents behind every click.",number:"01"},
  Breakdowns:{lead:"A thousand shores.",italic:"One audience.",line:"Discover where your visitors make landfall.",number:"02"},
  Funnels:{lead:"Follow the flow.",italic:"Find the friction.",line:"Trace a journey from first ripple to final destination.",number:"03"},
  Retention:{lead:"Some tides",italic:"always return.",line:"See who finds their way back to your shores.",number:"04"},
  Insights:{lead:"Dive a little",italic:"deeper.",line:"The most interesting stories live beneath the surface.",number:"05"},
};

export function OceanAtmosphere(){
  return <div className="ocean-atmosphere" aria-hidden="true"><div className="ocean-backplate"/><div className="ocean-sunlight"/><div className="ocean-grain"/><div className="ocean-bubbles">{Array.from({length:9},(_,i)=><i key={i} style={{left:(6+i*11)+"%",animationDelay:(i*-2.3)+"s",animationDuration:(19+i*2)+"s"}}/>)}</div></div>;
}
export function OceanHeader({report,children,compact=false}:{report:Report;children:ReactNode;compact?:boolean}){
  const chapter=chapters[report];
  return <header className={`ocean-chapter ocean-chapter-${report.toLowerCase()}${compact?" is-compact":""}`}>
    <div className="ocean-chapter-image" aria-hidden="true"/>
    <div className="ocean-chapter-copy"><div className="ocean-chapter-meta"><span>≈ TIDE / {report.toUpperCase()}</span><span>CHAPTER {chapter.number}</span></div><h1>{chapter.lead}<br/><em>{chapter.italic}</em></h1><p>{chapter.line}</p><div className="ocean-header-controls">{children}<span className="ocean-demo-label"><i/> ILLUSTRATIVE DEMO</span></div></div>
    <div className="ocean-hero-compass" aria-hidden="true"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="63" fill="none" stroke="currentColor" strokeWidth=".5"/>{Array.from({length:36},(_,i)=><path key={i} d={`M70 ${i%3===0?9:12}V17`} transform={`rotate(${i*10} 70 70)`} stroke="currentColor" strokeWidth=".7"/>)}<path d="M70 30L82 92L70 83L58 92Z" fill="currentColor"/><path d="M70 30V83" stroke="#043e57" strokeWidth="1"/><text x="70" y="29" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="monospace">N</text></svg><span>FOLLOW YOUR CURRENT</span></div>
    <svg className="ocean-foam" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 47C180 9 300 80 480 44S780 5 960 49S1260 90 1440 35V90H0Z" fill="currentColor" opacity=".22"/><path d="M0 58C200 10 290 90 490 55S800 18 980 59S1270 93 1440 48V90H0Z" fill="currentColor" opacity=".38"/><path d="M0 72C160 26 330 100 520 73S800 40 990 72S1240 108 1440 66V90H0Z" fill="currentColor"/></svg>
  </header>;
}
