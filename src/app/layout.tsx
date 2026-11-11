import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OceanBackdrop } from "@/components/ocean-backdrop";
import { NavLinks, SidebarNav } from "@/components/sidebar-nav";
import "./shell.css";
import "./reports.css";

export const metadata: Metadata = {
  title: { default: "TIDE | Digital Engagement Analytics", template: "%s | TIDE" },
  description: "Explore website engagement through transparent SQL analytics.",
};

// The shell (backdrop, sidebar, footer) is static. Each report reads its filters
// from the URL, so it renders per request inside the <Suspense> boundary.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <OceanBackdrop />
          <aside className="sidebar">
            <Link className="brand" href="/overview" aria-label="TIDE home"><span className="brand-icon">≈</span>TIDE<span className="brand-dot">.</span></Link>
            <div className="workspace"><span className="workspace-icon">G</span><div><strong>Merchandise Store</strong><small>Demo workspace</small></div></div>
            <p className="nav-label">REPORTS</p>
            <Suspense fallback={<NavLinks />}><SidebarNav /></Suspense>
            <div className="sidebar-bottom">
              <div className="dataset-note"><span className="status-dot" />Demo dataset<p>Illustrative e-commerce data,<br />1 Nov 2020 – 31 Jan 2021.</p></div>
              <div className="profile"><span className="avatar">N</span><div><strong>Najwa</strong><small>Personal workspace</small></div></div>
            </div>
          </aside>
          <div className="main-shell">
            <main>
              <Suspense fallback={<p className="tc-loading">Loading report…</p>}>{children}</Suspense>
              <footer className="page-footer"><span><span className="status-dot" />Illustrative demo data · No live tracking</span><span>TIDE / Tracking Insights on Digital Engagement</span></footer>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
