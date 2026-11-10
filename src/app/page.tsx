"use client";

import { useState } from "react";
import Link from "next/link";
import OverviewStudio from "./overview-studio";
import ReportStudio from "./report-studio";
import { OceanAtmosphere, OceanHeader } from "./ocean-experience";
import "./studio.css";
import "./ocean.css";
import "./hybrid.css";

const tabs = ["Overview", "Breakdowns", "Funnels", "Retention", "Insights"] as const;
type Tab = typeof tabs[number];
const icons = ["◫", "▥", "▽", "▦", "✧"];
export default function Home() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [device, setDevice] = useState("All devices");
  const [range, setRange] = useState("Last 30 days");
  const [showInfo, setShowInfo] = useState(false);
  const ratio = device === "Mobile" ? .37 : device === "Desktop" ? .57 : device === "Tablet" ? .06 : 1;
  const timeRatio = range === "Last 7 days" ? .25 : range === "Last 90 days" ? 2.7 : 1;
  const scale = ratio * timeRatio;
  return (
    <div className={`app-shell ocean-world design-coastal tide-hybrid ${tab === "Overview" ? "view-overview" : ""}`}>
      <OceanAtmosphere/>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="TIDE home"><span className="brand-icon">≈</span>TIDE<span className="brand-dot">.</span></Link>
        <div className="workspace"><span className="workspace-icon">G</span><div><strong>Merchandise Store</strong><small>Demo workspace</small></div><span className="chevron">⌄</span></div>
        <p className="nav-label">CHART YOUR COURSE</p>
        <nav aria-label="Reports">{tabs.map((item,i)=><button key={item} className={tab===item?"nav-item active":"nav-item"} onClick={()=>setTab(item)} aria-current={tab===item?"page":undefined}><span className="nav-icon" aria-hidden="true">{icons[i]}</span>{item}{item==="Insights"&&<span className="nav-count">3</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="dataset-note"><span className="status-dot" />Demo dataset<p>Explore TIDE with illustrative<br/>e-commerce activity.</p></div><div className="profile"><span className="avatar">N</span><div><strong>Najwa</strong><small>Personal workspace</small></div></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{tab}</strong></div><button className="demo-badge" onClick={()=>setShowInfo(!showInfo)} aria-expanded={showInfo}>◉ Demo data</button></header>
        <main>
          {showInfo&&<div className="info-banner">This is an interactive design prototype. All numbers are invented examples, not findings from GA4. Filters simulate report changes. No database or sign-in is required.</div>}
          <OceanHeader report={tab} compact={tab !== "Overview"}><div className="filters"><label><span className="sr-only">Device</span><select value={device} onChange={e=>setDevice(e.target.value)}>{["All devices","Desktop","Mobile","Tablet"].map(v=><option key={v}>{v}</option>)}</select></label><label><span className="sr-only">Date range</span><select value={range} onChange={e=>setRange(e.target.value)}>{["Last 30 days","Last 7 days","Last 90 days"].map(v=><option key={v}>{v}</option>)}</select></label></div></OceanHeader>
          {tab==="Overview"&&<OverviewStudio scale={scale} device={device} onNavigate={setTab}/>}
          {tab!=="Overview"&&<ReportStudio report={tab} scale={scale} onNavigate={setTab}/>}
          <footer className="page-footer"><span><span className="status-dot"/>Illustrative demo data · No live tracking</span><span>TIDE / Tracking Insights on Digital Engagement</span></footer>
        </main>
      </div>
    </div>
  );
}
