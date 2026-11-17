"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { OceanAtmosphere, OceanHeader } from "./ocean-experience";
import { Breakdowns, Funnels, Insights, Overview, Retention, type Report } from "./reports";
import { devices, periods, type Device, type Period } from "./demo-data";
import { useAnalyticsView } from "./use-analytics-view";
import "./studio.css";
import "./ocean.css";
import "./clarity.css";
import "./sidebar.css";

const tabs: Report[] = ["Overview", "Breakdowns", "Funnels", "Retention", "Insights"];
const sidebarPreferenceKey = "tide.sidebar.collapsed";
let fallbackSidebarCollapsed = false;
let sidebarStorageUnavailable = false;

function readSidebarPreference() {
  if (sidebarStorageUnavailable) return fallbackSidebarCollapsed;
  try {
    return window.localStorage.getItem(sidebarPreferenceKey) === "true";
  } catch {
    return fallbackSidebarCollapsed;
  }
}

function subscribeSidebarPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("tide-sidebar-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("tide-sidebar-change", onChange);
  };
}

function initialSidebarPreference() {
  return false;
}

type SidebarTooltip = { label: Report; left: number; top: number };
const reportIcons: Record<Report, string> = {
  Overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  Breakdowns: "M5 20V10 M12 20V4 M19 20v-7",
  Funnels: "M3 4h18l-7 8v7l-4 2v-9z",
  Retention: "M4 5h16v15H4z M4 10h16 M9 5v15 M15 5v15",
  Insights: "M12 3l2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7z",
};

function ReportIcon({ report }: { report: Report }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={reportIcons[report]} />
    </svg>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Report>("Overview");
  const [device, setDevice] = useState<Device>("All devices");
  const [period, setPeriod] = useState<Period>("Dec 2020");
  const [showInfo, setShowInfo] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    readSidebarPreference,
    initialSidebarPreference,
  );
  const [sidebarTooltip, setSidebarTooltip] = useState<SidebarTooltip | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const view = useAnalyticsView(device, period);

  function toggleSidebar() {
    const collapsed = !sidebarCollapsed;
    fallbackSidebarCollapsed = collapsed;
    try {
      window.localStorage.setItem(sidebarPreferenceKey, String(collapsed));
      sidebarStorageUnavailable = false;
    } catch {
      // Keep the toggle usable when browser storage is unavailable.
      sidebarStorageUnavailable = true;
    }
    window.dispatchEvent(new Event("tide-sidebar-change"));
    setSidebarTooltip(null);
  }

  function showSidebarTooltip(button: HTMLButtonElement, label: Report) {
    if (!sidebarCollapsed || !window.matchMedia("(min-width: 601px)").matches) return;
    const rect = button.getBoundingClientRect();
    const sidebarRight = button.closest(".sidebar")?.getBoundingClientRect().right ?? rect.right;
    setSidebarTooltip({
      label,
      left: sidebarRight + 10,
      top: Math.max(24, Math.min(window.innerHeight - 24, rect.top + rect.height / 2)),
    });
  }

  useEffect(() => {
    if (!sidebarTooltip) return;
    const dismiss = () => setSidebarTooltip(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [sidebarTooltip]);

  useEffect(() => {
    function revealSelectedReport() {
      const nav = navigationRef.current;
      const selected = nav?.querySelector<HTMLButtonElement>('[aria-current="page"]');
      if (!nav || !selected) return;
      const mobile = window.matchMedia("(max-width: 600px)").matches;
      const viewport = mobile ? nav : nav.parentElement;
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      if (mobile) {
        const left = Math.min(0, item.left - bounds.left - 6)
          + Math.max(0, item.right - bounds.right + 6);
        viewport.scrollBy({ left, behavior: "instant" });
      } else {
        const top = Math.min(0, item.top - bounds.top - 6)
          + Math.max(0, item.bottom - bounds.bottom + 6);
        viewport.scrollBy({ top, behavior: "instant" });
      }
    }
    revealSelectedReport();
    window.addEventListener("resize", revealSelectedReport);
    return () => window.removeEventListener("resize", revealSelectedReport);
  }, [tab, sidebarCollapsed]);

  return (
    <div className={`app-shell ocean-world design-coastal tide-clear ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${tab === "Overview" ? "view-overview" : ""}`}>
      <OceanAtmosphere />
      <aside className="sidebar">
        <div className="sidebar-heading">
          <Link className="brand" href="/" aria-label="TIDE home">
            <span className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 12c4-6 9 6 14 0s7-3 8-2 M5 20c4-6 9 6 14 0s7-3 8-2" />
              </svg>
            </span>
            <span className="brand-wordmark">TIDE<span className="brand-dot">.</span></span>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="sidebar-chevron" aria-hidden="true" />
          </button>
        </div>
        <div className="sidebar-scroll">
          <div className="workspace"><span className="workspace-icon">G</span><div><strong>Merchandise Store</strong><small>GA4 sample workspace</small></div></div>
          <p className="nav-label">REPORTS</p>
          <nav ref={navigationRef} aria-label="Reports">
            {tabs.map((item) => (
              <button
                key={item}
                className={tab === item ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setTab(item);
                  setSidebarTooltip(null);
                }}
                onMouseEnter={(event) => showSidebarTooltip(event.currentTarget, item)}
                onMouseLeave={() => setSidebarTooltip(null)}
                onFocus={(event) => showSidebarTooltip(event.currentTarget, item)}
                onBlur={() => setSidebarTooltip(null)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSidebarTooltip(null);
                }}
                aria-label={item}
                aria-describedby={sidebarTooltip?.label === item ? "sidebar-report-tooltip" : undefined}
                aria-current={tab === item ? "page" : undefined}
              >
                <span className="nav-icon"><ReportIcon report={item} /></span>
                <span className="nav-text">{item}</span>
                {item === "Insights" && <span className="nav-count">3</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="dataset-note"><span className="status-dot" />GA4 sample<p>0.5% visitor sample,<br />1 Nov 2020 – 31 Jan 2021.</p></div>
          </div>
        </div>
        <div className="profile"><span className="avatar">N</span><div><strong>Najwa</strong><small>Personal workspace</small></div></div>
      </aside>
      {sidebarTooltip && createPortal(
        <div
          id="sidebar-report-tooltip"
          className="sidebar-report-tooltip"
          role="tooltip"
          style={{ left: sidebarTooltip.left, top: sidebarTooltip.top }}
        >
          {sidebarTooltip.label}
        </div>,
        document.body,
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="report-location">
            <span className="toolbar-icon"><ReportIcon report={tab} /></span>
            <span className="toolbar-section">Reports</span>
            <span className="toolbar-separator" aria-hidden="true">/</span>
            <strong>{tab}</strong>
          </div>
          <Link className="ocean-preview-link" href="/ocean">Ocean view ↗</Link>
          <button className="demo-badge" onClick={() => setShowInfo(!showInfo)} aria-expanded={showInfo}>
            <span className="status-dot" aria-hidden="true" />
            GA4 sample
            <span className="demo-info-icon" aria-hidden="true">i</span>
          </button>
        </header>
        <main>
          {showInfo && <div className="info-banner">Google’s obfuscated GA4 e-commerce sample · 0.5% of visitors, 1 Nov 2020–31 Jan 2021. Counts describe this sample, not the full store. Segments use each visitor’s first recorded source, country or device in the selected period. The ordered funnel can show fewer buyers than total purchasers because some steps are missing. Small groups are uncertain.</div>}
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
          <footer className="page-footer"><span><span className="status-dot" />GA4 sample · 0.5% of visitors · {view.dataset.delivery === "database" ? "Supabase report" : "Saved Supabase report"}</span><span>TIDE / Tracking Insights on Digital Engagement</span></footer>
        </main>
      </div>
    </div>
  );
}
