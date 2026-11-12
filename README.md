# TIDE

**Tracking Insights on Digital Engagement**

## Current prototype

Five reports each have two distinct presentations: Coastal Bento and Ocean Atlas.

| Report | Coastal Bento | Ocean Atlas |
| --- | --- | --- |
| Overview | Metric cards and a visitor activity chart | Interactive journey terrain map |
| Breakdowns | Segment comparison and focus cards | Selectable audience islands |
| Funnels | Selectable funnel step cards | Journey waypoints and a detail panel |
| Retention | Interactive cohort heatmap | Cohort and week retention rings |
| Insights | Editorial evidence cards | Selectable field notes |

The interface includes generated aerial ocean artwork, decorative motion, responsive layouts, filters, and reduced-motion support. All displayed metrics, geographic shapes, and example findings are illustrative. No live visitor tracking is active.

## Stack

- Next.js 16.4.5, React 19.3, TypeScript
- CSS and SVG visualizations
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
npx tsc --noEmit
npm run build -- --webpack
~~~

The production build and TypeScript checks passed on Next.js 16.4.5 before this repository baseline. Report interactions and all five reports in both themes were checked in the browser; mobile page widths were checked at 390px.

## Roadmap

- [x] Next.js and TypeScript foundation
- [x] Five interactive prototype reports in both design modes
- [x] Local ocean artwork and responsive styling
- [x] Server-only PostgreSQL helper and connection-check script
- [x] Local database connectivity verified during initial setup
- [ ] Agree the final prototype design
- [ ] Configure Google login
- [ ] Extract a user-level GA4 sample in BigQuery
- [ ] Import/clean events and record data-quality issues
- [ ] Build visitor and visit_session models
- [ ] Replace demo values with SQL-driven reports
- [ ] Write findings from the real sample data
- [ ] Deploy to Vercel

Design review is the current priority. The database may need fresh local credentials; no credentials are included in this repository.
