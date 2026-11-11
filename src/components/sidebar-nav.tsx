"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { reports } from "@/lib/reports";

/** Report links. Keeps the current filters (the query string) when moving between reports. */
export function SidebarNav() {
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams());
  params.delete("by"); // the Breakdowns tab choice doesn't apply to other reports
  const query = params.toString();
  return <NavLinks active={pathname} query={query ? `?${query}` : ""} />;
}

/** Also used on its own as the loading fallback, before the query string is known. */
export function NavLinks({ active = "", query = "" }: { active?: string; query?: string }) {
  return (
    <nav aria-label="Reports">
      {reports.map((r) => {
        const on = active === `/${r.slug}`;
        return (
          <Link key={r.slug} href={`/${r.slug}${query}`} className={on ? "nav-item active" : "nav-item"} aria-current={on ? "page" : undefined}>
            <span className="nav-icon" aria-hidden="true">{r.icon}</span>{r.name}
          </Link>
        );
      })}
    </nav>
  );
}
