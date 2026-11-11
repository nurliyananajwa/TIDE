# Audit trail

## Repository baseline — 2026-11-10

This first Git commit captures the existing TIDE prototype and its supporting database connection helper. It does not recreate historical commits for work that was not previously versioned.

Completed before this baseline:
- Initial Next.js/TypeScript app and Supabase PostgreSQL helper.
- Coastal Bento and Ocean Atlas design variants for five reports.
- Separate detailed report layouts and interactions in each theme.
- Photographic ocean atmosphere, local generated artwork, motion and mobile styling.
- Next.js patch update from 16.4.4 to 16.4.5.

Important decisions:
- Supabase replaces Neon because the project owner is familiar with Supabase.
- Direct SQL through pg replaces Prisma.
- Prototype design is reviewed before implementing authentication and real analytics.
- All current report values are illustrative; they are not findings from the GA4 dataset.
- The original goal remains a deployed data analyst portfolio project, with hand-written SQL calculating the real metrics.

Validation already performed:
- Production build and TypeScript checks on Next.js 16.4.5.
- Successful local HTTP preview.
- Report controls, theme switching, and selected-state preservation in the browser.
- All five reports in both themes at a 390px viewport without horizontal page overflow.
- Database connectivity during initial setup, using local credentials only.

## Design decision and cleanup — 2026-11-11

- The two design variants were merged into one: the Ocean look around Coastal Bento's clearer charts. Ocean Atlas charts whose shapes did not match their numbers (retention rings, audience islands, fixed funnel circles) were dropped.
- Each report now follows one pattern: answer sentence, one labelled chart, detail table.
- Codebase cleanup in three commits (delete, merge, refactor): CSS went from 108 KB in five files to about 24 KB in two; Tailwind was removed because no component used it; the single client-side page became one server-rendered route per report with filters in the URL; all numbers come through `getView()` in `src/lib/view.ts`.
- Checks: the text of every report was compared before and after for all 12 device and month combinations, and screenshots at seven widths (390 to 1600px) were compared pixel by pixel.

## Recording future work

Each change should have a focused Git commit. Record the concrete behavior changed and relevant checks in its message or pull request. Do not invent dates or describe illustrative data as real findings. Keep credentials and generated caches out of Git.

Git history begins at this baseline; this document supplies context for the earlier unversioned work.
