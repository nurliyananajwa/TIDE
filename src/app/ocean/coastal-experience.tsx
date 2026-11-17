"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { devices, fmt, pct, periods, type Device, type Period } from "../demo-data";
import { useAnalyticsView } from "../use-analytics-view";
import { oceanStages, stageMetric } from "./ocean-stages";
import { StageReport } from "./stage-report";
import { startCoastalMotion } from "./coastal-motion";
import styles from "./coastal.module.css";

const photograph = "/ocean/tide-coastline-v1.webp";
const shorePoints = [{x:81.2,y:61.5},{x:78.6,y:35.7},{x:60.8,y:19.3},{x:45.3,y:11.5}];

export default function CoastalExperience() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const panoramaRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const filterButtonRef=useRef<HTMLButtonElement>(null);
  const filterPanelRef=useRef<HTMLDivElement>(null);
  const navRefs=useRef<(HTMLButtonElement|null)[]>([]);
  const motionRef=useRef({enabled:true});
  const [motion,setMotion]=useState(true);
  const [activeIndex,setActiveIndex]=useState(0);
  const [reportOpen,setReportOpen]=useState(false);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [coastline,setCoastline]=useState(false);
  const [device,setDevice]=useState<Device>("All devices");
  const [period,setPeriod]=useState<Period>("Dec 2020");
  const view=useAnalyticsView(device,period);
  const activeStage=oceanStages[activeIndex];
  const metric=stageMetric(activeStage.id,view);
  const visitorChange=view.previous?.visitors?(view.totals.visitors/view.previous.visitors-1)*100:null;
  const metricContext=activeIndex===0
    ? visitorChange===null?"Selected period":`${visitorChange>=0?"+":""}${visitorChange.toFixed(0)}% vs ${view.previousLabel}`
    : activeIndex===1?`${pct(view.funnel[0].people/view.totals.visitors,0)} of all visitors`
    : activeIndex===2?`${pct(view.totals.rate)} of all visitors`:`${pct(view.totals.returningShare,0)} of all visitors`;

  useEffect(()=>{
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{motionRef.current.enabled=!preference.matches;setMotion(!preference.matches);};
    update();
    preference.addEventListener("change",update);
    const panorama=panoramaRef.current!;
    const resize=new ResizeObserver(([entry])=>{
      const {width,height}=entry.contentRect;
      const photoWidth=Math.max(width,height*1585/992);
      const photoHeight=Math.max(height,width*992/1585);
      panorama.style.width=`${photoWidth}px`;
      panorama.style.height=`${photoHeight}px`;
      panorama.querySelectorAll<HTMLButtonElement>("button").forEach((marker,index)=>{
        const x=(shorePoints[index].x/100-0.5)*photoWidth*1.025+width/2;
        const y=(shorePoints[index].y/100-0.5)*photoHeight*1.025+height/2;
        marker.hidden=x<28||x>width-28||y<76||y>height-200;
      });
    });
    resize.observe(panorama.parentElement!);
    const dispose=startCoastalMotion(canvasRef.current!,photograph,motionRef.current);
    return ()=>{dispose();resize.disconnect();preference.removeEventListener("change",update);};
  },[]);

  useEffect(()=>{
    if(reportOpen) closeRef.current?.focus({preventScroll:true});
  },[reportOpen,activeIndex]);

  function openReport(index:number) {
    setActiveIndex(index);setCoastline(false);setFiltersOpen(false);setReportOpen(true);
  }
  function closeReport() {
    setFiltersOpen(false);
    setReportOpen(false);
    navRefs.current[activeIndex]?.focus({preventScroll:true});
  }
  function resetParallax() {
    panoramaRef.current?.style.setProperty("--pointer-x","0px");
    panoramaRef.current?.style.setProperty("--pointer-y","0px");
  }

  return <main
    className={`${styles.scene} ${!motion?styles.paused:""} ${reportOpen?styles.reportOpen:""} ${coastline?styles.coastline:""}`}
    onPointerMove={event=>{
      if(!motionRef.current.enabled||event.pointerType!=="mouse") return;
      panoramaRef.current?.style.setProperty("--pointer-x",`${(event.clientX/event.currentTarget.clientWidth-0.5)*-12}px`);
      panoramaRef.current?.style.setProperty("--pointer-y",`${(event.clientY/event.currentTarget.clientHeight-0.5)*-8}px`);
    }}
    onPointerLeave={resetParallax}
    onPointerDown={event=>{
      if(filtersOpen&&!filterPanelRef.current?.contains(event.target as Node)&&!filterButtonRef.current?.contains(event.target as Node))setFiltersOpen(false);
    }}
    onKeyDown={event=>{
      if(event.key==="Escape") {
        if(filtersOpen){setFiltersOpen(false);filterButtonRef.current?.focus();}
        else if(reportOpen)closeReport();
        else setCoastline(false);
      }
    }}
  >
    <div ref={panoramaRef} className={styles.panorama}>
      <div className={styles.drift}>
        {/* The optimized photo provides an immediate, accessible fallback for the water effect. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.photograph} src={photograph} alt="Sunlit forest and rugged coves along a blue ocean coastline" fetchPriority="high" decoding="async" />
        <canvas ref={canvasRef} className={styles.water} aria-hidden="true" />
        {oceanStages.map((stage,index)=><button
          key={stage.id}
          className={styles.shoreMarker}
          style={{"--shore-x":`${shorePoints[index].x}%`,"--shore-y":`${shorePoints[index].y}%`} as CSSProperties}
          aria-label={`Open ${stage.name} coastal report`}
          aria-expanded={reportOpen&&activeIndex===index}
          aria-current={activeIndex===index?"step":undefined}
          aria-controls="coastal-report"
          onClick={()=>openReport(index)}
        >
          <span className={styles.markerRing}>{String(index+1).padStart(2,"0")}</span>
          <span className={styles.markerName}>{stage.name} <span aria-hidden="true">↗</span></span>
        </button>)}
      </div>
    </div>
    <div className={styles.shade} aria-hidden="true" />

    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="TIDE dashboard">
        <svg width="43" height="25" viewBox="0 0 48 28" fill="none" aria-hidden="true"><path d="M3 11C10 4 14 4 23 10C31 16 35 16 45 7M3 21C10 14 14 14 23 20C31 26 35 26 45 17" stroke="currentColor" strokeWidth="3.5" /></svg>
        <span>TIDE.</span>
      </Link>
      <span className={styles.headerLabel}>Visitor journey</span>
      <Link href="/" className={styles.dashboardLink}>Dashboard <span aria-hidden="true">↗</span></Link>
    </header>

    <section className={styles.hero} aria-label="Explore the visitor journey">
      <h1>Follow the<br />visitor<br /><em>current.</em></h1>
      <p className={styles.introCopy}>See how people arrive, engage,<br />purchase and return.</p>
      <button className={styles.heroMetric} onClick={()=>openReport(activeIndex)} aria-label={`Open ${activeStage.name} report`}>
        <span className={styles.metricEyebrow}>{String(activeIndex+1).padStart(2,"0")} / {activeStage.name}<span aria-hidden="true">↗</span></span>
        <span className={styles.metricValue} aria-live="polite">{fmt(metric.value)}</span>
        <span className={styles.metricCaption}>{metric.unit} · {metricContext}</span>
        <span className={styles.reportCta}>View {activeStage.name.toLowerCase()} report <span aria-hidden="true">↗</span></span>
      </button>
    </section>

    {reportOpen&&<aside key={activeStage.id} id="coastal-report" className={styles.report} aria-labelledby="coastal-report-title">
      <div className={styles.reportTop}>
        <span className={styles.eyebrow}>{String(activeIndex+1).padStart(2,"0")} / Journey report</span>
        <button ref={closeRef} className={styles.close} onClick={closeReport} aria-label="Close report">×</button>
      </div>
      <h2 id="coastal-report-title">{activeStage.name}</h2>
      <div className={styles.reportContext}>
        <span>{device} <i aria-hidden="true">·</i> {period}</span>
        <button ref={filterButtonRef} className={styles.filterButton} aria-expanded={filtersOpen} aria-controls="coastal-filters" onClick={()=>setFiltersOpen(!filtersOpen)}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4H14M2 12H14M5 2V6M11 10V14" stroke="currentColor" strokeWidth="1.4" /></svg> Filters
        </button>
      </div>
      {filtersOpen&&<div ref={filterPanelRef} id="coastal-filters" className={styles.filterPanel}>
        <div className={styles.filterPanelTop}><strong>Report filters</strong><button onClick={()=>{setFiltersOpen(false);filterButtonRef.current?.focus();}}>Done</button></div>
        <div className={styles.filters}>
          <label>Device<select value={device} onChange={event=>setDevice(event.target.value as Device)}>{devices.map(item=><option key={item}>{item}</option>)}</select></label>
          <label>Period<select value={period} onChange={event=>setPeriod(event.target.value as Period)}>{periods.map(item=><option key={item}>{item}</option>)}</select></label>
        </div>
      </div>}
      <StageReport stage={activeStage.id} view={view} />
      <p className={styles.demoNote}>GA4 sample · 0.5% of visitors · {period}</p>
    </aside>}

    <nav className={styles.journeyNav} aria-label="Journey stages">
      {oceanStages.map((stage,index)=>{
        const stageValue=stageMetric(stage.id,view);
        return <button key={stage.id} ref={element=>{navRefs.current[index]=element;}}
          aria-label={stage.name}
          aria-current={activeIndex===index?"step":undefined}
          aria-expanded={reportOpen&&activeIndex===index}
          aria-controls="coastal-report"
          onClick={()=>openReport(index)}
          onKeyDown={event=>{
            let target:number|undefined;
            if(event.key==="ArrowRight")target=(index+1)%oceanStages.length;
            if(event.key==="ArrowLeft")target=(index+oceanStages.length-1)%oceanStages.length;
            if(event.key==="Home")target=0;
            if(event.key==="End")target=oceanStages.length-1;
            if(target!==undefined){event.preventDefault();navRefs.current[target]?.focus();}
          }}
        >
          <span className={styles.stageTitle}><span>{String(index+1).padStart(2,"0")}</span><strong>{stage.name}</strong></span>
          <small>{fmt(stageValue.value)} {stageValue.unit}</small>
        </button>;
      })}
    </nav>

    <footer className={styles.footer}>
      <span>GA4 sample · {view.dataset.delivery === "database" ? "Supabase report" : "Saved Supabase report"}</span>
      <button className={styles.motionButton} aria-pressed={motion} aria-label={motion?"Pause coastal motion":"Play coastal motion"} onClick={()=>{
        motionRef.current.enabled=!motion;setMotion(!motion);resetParallax();
      }}><span aria-hidden="true">{motion?"Ⅱ":"▷"}</span><span>{motion?"Pause motion":"Play motion"}</span></button>
      <button className={styles.exploreLink} aria-pressed={coastline} onClick={()=>{
        if(reportOpen)closeReport();
        setCoastline(!coastline);
      }}>{coastline?"Back to the journey":"Explore the coastline"}<span aria-hidden="true">{coastline?"↙":"↗"}</span></button>
    </footer>
    {coastline&&<p className={styles.exploreHint}>Select a journey stage to open a report</p>}
  </main>;
}
