"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OceanAtmosphere, OceanHeader } from "./ocean-experience";
import { Breakdowns, Funnels, Insights, Overview, Retention, type Report } from "./reports";
import { devices, getView, periods, type Device, type Period } from "./demo-data";
import "./studio.css";
import "./ocean.css";
import "./clarity.css";

const tabs: Report[] = ["Overview", "Breakdowns", "Funnels", "Retention", "Insights"];
const icons = ["◫", "▥", "▽", "▦", "✧"];

export default function Home() {
  const [tab, setTab] = useState<Report>("Overview");
  const [device, setDevice] = useState<Device>("All devices");
  const [period, setPeriod] = useState<Period>("Dec 2020");
  const [showInfo, setShowInfo] = useState(false);
  const view = useMemo(() => getView(device, period), [device, period]);

  return (
    <div className={`app-shell ocean-world design-coastal tide-clear ${tab === "Overview" ? "view-overview" : ""}`}>
      <OceanAtmosphere />
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="TIDE home"><span className="brand-icon">≈</span>TIDE<span className="brand-dot">.</span></Link>
        <div className="workspace"><span className="workspace-icon">G</span><div><strong>Merchandise Store</strong><small>Demo workspace</small></div><span className="chevron">⌄</span></div>
        <p className="nav-label">REPORTS</p>
        <nav aria-label="Reports">{tabs.map((item, i) => <button key={item} className={tab === item ? "nav-item active" : "nav-item"} onClick={() => setTab(item)} aria-current={tab === item ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{icons[i]}</span>{item}{item === "Insights" && <span className="nav-count">3</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="dataset-note"><span className="status-dot" />Demo dataset<p>Illustrative e-commerce data,<br />1 Nov 2020 – 31 Jan 2021.</p></div><div className="profile"><span className="avatar">N</span><div><strong>Najwa</strong><small>Personal workspace</small></div></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{tab}</strong></div><button className="demo-badge" onClick={() => setShowInfo(!showInfo)} aria-expanded={showInfo}>◉ Demo data</button></header>
        <main>
          {showInfo && <div className="info-banner">This is a design prototype. All numbers are invented but consistent with each other, so the filters recalculate every report. They are not findings from GA4.</div>}
          <OceanHeader report={tab} compact={tab !== "Overview"}>
            <div className="filters">
              <label><span className="tc-filter-label">Device</span><select value={device} onChange={(e) => setDevice(e.target.value as Device)}>{devices.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label><span className="tc-filter-label">Period</span><select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>{periods.map((v) => <option key={v}>{v}</option>)}</select></label>
            </div>
          </OceanHeader>
          {tab === "Overview" && <Overview view={view} onNavigate={setTab} />}
          {tab === "Breakdowns" && <Breakdowns view={view} />}
          {tab === "Funnels" && <Funnels view={view} />}
          {tab === "Retention" && <Retention view={view} />}
          {tab === "Insights" && <Insights view={view} onNavigate={setTab} />}
          <footer className="page-footer"><span><span className="status-dot" />Illustrative demo data · No live tracking</span><span>TIDE / Tracking Insights on Digital Engagement</span></footer>
        </main>
      </div>
    </div>
  );
}
