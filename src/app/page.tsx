"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OceanAtmosphere, OceanHeader } from "./ocean-experience";
import { reports, type Report } from "@/lib/reports";
import { Breakdowns, Funnels, Insights, Overview, Retention } from "./reports";
import { devices, getView, periods, type Device, type Period } from "./demo-data";


export default function Home() {
  const [tab, setTab] = useState<Report>("Overview");
  const [device, setDevice] = useState<Device>("All devices");
  const [period, setPeriod] = useState<Period>("Dec 2020");
  const view = useMemo(() => getView(device, period), [device, period]);

  return (
    <div className="app-shell">
      <OceanAtmosphere />
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="TIDE home"><span className="brand-icon">≈</span>TIDE<span className="brand-dot">.</span></Link>
        <div className="workspace"><span className="workspace-icon">G</span><div><strong>Merchandise Store</strong><small>Demo workspace</small></div></div>
        <p className="nav-label">REPORTS</p>
        <nav aria-label="Reports">{reports.map((r) => <button key={r.name} className={tab === r.name ? "nav-item active" : "nav-item"} onClick={() => setTab(r.name)} aria-current={tab === r.name ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{r.icon}</span>{r.name}</button>)}</nav>
        <div className="sidebar-bottom"><div className="dataset-note"><span className="status-dot" />Demo dataset<p>Illustrative e-commerce data,<br />1 Nov 2020 – 31 Jan 2021.</p></div><div className="profile"><span className="avatar">N</span><div><strong>Najwa</strong><small>Personal workspace</small></div></div></div>
      </aside>
      <div className="main-shell">
        <main>
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
