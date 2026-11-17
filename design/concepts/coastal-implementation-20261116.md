# TIDE coastal implementation · 16 November 2026

The approved `coastal-mockup-v1-20261116.png` is implemented in the active local prototype at `http://localhost:3000/ocean`.

Active source: `work/combined-review/TIDE-design-ocean-bento/src/app/ocean/`, relative to the TIDE repository. `page.tsx` now renders `CoastalExperience`. The photographic composition uses real text and controls, not a screenshot of the mockup. The main analytics dashboard is still available through the Dashboard link.

## Behavior

- Four numbered coastal points and a four-stage navigation row open Discovery, Engagement, Conversion and Return reports.
- Device and period filters update the shared illustrative dataset, navigation totals and selected-stage summary.
- Return offers selectable retention weeks.
- Report close and Escape return focus to the selected journey button. Arrow keys, Home and End move focus through the stage navigation.
- Explore the coastline clears the headline for a scenic view. Pause motion stops the water effect, background drift and pointer parallax. Reduced-motion preferences are respected.
- Narrow screens use a two-column navigation row and scrollable report panel. Offscreen coastal markers are removed from keyboard navigation.

## Assets

`work/combined-review/TIDE-design-ocean-bento/public/ocean/tide-coastline-v1.webp` is the project-bound background. It was created using the built-in image-generation tool, with the approved concept as the edit target, then exported as WebP at quality 91 (1585 × 992, approximately 435 KB). UI is rendered independently in HTML/CSS. A small image displacement shader animates the water; the photograph remains visible when WebGL is unavailable.

## Validation

- Production build and TypeScript completed successfully with the existing Next.js 16.4.5 installation. Both `/` and `/ocean` were generated.
- Browser checked at the normal preview size, 1536 × 960, and 390 × 844. Desktop had no horizontal overflow and the water renderer initialized successfully.
- Opened all four reports, tested a shore marker, changed device and period filters, selected a retention week, and checked Escape/Home keyboard behavior and focus restoration.
- Checked pause/play motion and Explore/Back behavior. Browser error logs were clear.

## Report refinements

- Added an always-visible "View [stage] report" link to the opening metric.
- Moved the report panel to the left, keeping the selected shore point in view on desktop. The active point has a persistent seafoam ring, subtle surrounding glow, stronger leader line and stage label; other points are quieter while a report is open.
- Replaced the oversized report introduction with a compact title and filter context. A short, data-derived takeaway leads each report. The main chart comes before expandable explanatory details.
- Moved device and period controls into a compact Filters popover. Selected values stay visible in the report header. Escape closes the popover first and restores focus to Filters.
- Retention takeaways and the secondary metric follow the selected week. Drop-off explanations and retention definitions remain available in expandable details.
- Browser measurements confirmed the Discovery and Conversion charts fit in the desktop panel without scrolling, and the retention chart fits at 390 × 844 without horizontal overflow.

### Background edit prompt

Use case: precise-object-edit. Edit target: the supplied approved TIDE coastal website mockup. Create the clean photographic BACKGROUND ASSET for implementing this exact mockup as a real website. Remove EVERY piece of typography, all words, numbers, branding, wave logo, interface elements, marker circles, leader lines, rules, underlines, buttons and graphics. Reconstruct the natural ocean, shoreline and forest beneath them seamlessly. Preserve the existing beautiful photographic coastal landscape, drone camera angle, exact composition and coastline geometry, fine rippled deep blue ocean on the left, warm sunlit forest and natural weathered rock coves along the right, surf, turquoise shallows, hazy distant headlands, and landscape 16:10 crop. Preserve the readable darker open water at left without adding graphic gradients. Render natural crisp fine photographic details, never low-poly terrain or painted bushes. The background must fill the frame edge to edge, no borders. The sole output is the same realistic coastal scene WITHOUT ANY text or UI of any kind. Do not change the landscape, lighting, palette, camera or composition.
