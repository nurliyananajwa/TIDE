# TIDE

**Tracking Insights on Digital Engagement**

An ocean-inspired product analytics portfolio project. The current milestone is an interactive design prototype with illustrative data. The planned analytics implementation uses hand-written PostgreSQL queries.

## Current prototype

One design: an ocean look around plain, readable analytics. Every report opens with a one-sentence answer, then one labelled chart, then a detail table.

| Report | URL | Question it answers |
| --- | --- | --- |
| Overview | `/overview` | How many people visit, how many buy, and how is that changing? |
| Breakdowns | `/breakdowns` | Who visits, and who buys? (by device, traffic source or country) |
| Funnels | `/funnels` | Where do buyers drop off? |
| Retention | `/retention` | Who comes back? |
| Insights | `/insights` | What should we act on? |

The device and month filters live in the URL (for example `/funnels?device=mobile&period=2021-01`), so any report view can be linked. Pages render on the server.

All displayed numbers are illustrative but consistent with each other. No live visitor tracking is active.

## Project structure

```
src/
  app/
    layout.tsx            app shell: backdrop, sidebar, footer
    <report>/page.tsx     one server-rendered page per report
    shell.css             reset, tokens, sidebar, banner, filters, footer
    reports.css           report content: cards, charts, tables
  components/             charts, banner, filter bar, journey map, shared UI
  lib/
    view.ts               the data contract: getView(filters) returns everything a report needs
    demo-view.ts          TEMPORARY illustrative numbers; delete once SQL is in place
    analysis.ts           calculations shared between reports (funnel losses, rankings, retention curve)
    filters.ts            reads and writes the URL filters
    format.ts             number and date formatting
    reports.ts            the list of reports (name, URL, banner copy)
    db.ts                 server-only PostgreSQL helper
```

**Moving to real data:** write SQL that returns the `View` shape and call it from `getView()` in `lib/view.ts`. No page, chart or stylesheet needs to change.

## Stack

- Next.js 16.4.5, React 19.3, TypeScript
- Plain CSS (no framework) and hand-drawn SVG charts
- PostgreSQL hosted on Supabase, accessed server-side through pg
- Planned: Better Auth with Google login, GA4 sample extraction through BigQuery, deployment to Vercel

Prisma and Neon are not used.

## Run locally

Requires Node.js 24 and npm.

~~~sh
npm ci
npm run dev -- --webpack
~~~

Open http://localhost:3000. The design prototype runs without database credentials.

For the optional database check:

1. Copy .env.example to .env.local.
2. Set DATABASE_URL to your Supabase transaction-pooler URI.
3. URL-encode special characters in the password.
4. Run npm run db:check.

The database helper uses the public Supabase CA certificate in certs/supabase-ca.crt and verifies TLS. Never commit passwords, private keys, or populated environment files.

## Validation

~~~sh
npm run typecheck
npm run lint
npm run build
~~~

## Roadmap

- [x] Next.js and TypeScript foundation
- [x] Five prototype reports
- [x] Local ocean artwork and responsive styling
- [x] Server-only PostgreSQL helper and connection-check script
- [x] Local database connectivity verified during initial setup
- [x] Agree the final prototype design
- [x] Clean up: one page per report, filters in the URL, single data contract
- [ ] Configure Google login
- [ ] Extract a user-level GA4 sample in BigQuery
- [ ] Import/clean events and record data-quality issues
- [ ] Build visitor and visit_session models
- [ ] Replace demo values with SQL-driven reports
- [ ] Write findings from the real sample data
- [ ] Deploy to Vercel

Getting the real GA4 sample is the next priority. The database may need fresh local credentials; no credentials are included in this repository.

## Audit trail and collaboration

This repository starts with an honest snapshot of the existing prototype. Earlier design iterations were developed locally and are documented in docs/AUDIT_TRAIL.md; they are not represented as backdated commits.

For future work, make a focused commit for each change, explain its purpose, and record the checks performed. Use branches and pull requests when reviewing larger changes. Coordinate file ownership between contributors before editing the same files.

## Artwork

public/ocean/tide-aerial.webp was generated with the built-in image-generation tool for this project. It is stored locally; there is no external image dependency. Cartographic graphics are conceptual visitor-journey illustrations.
