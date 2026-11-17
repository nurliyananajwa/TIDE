# TIDE analytics data

The reports use Google's obfuscated GA4 e-commerce sample, originally hosted in
`bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`.
Source documentation: https://developers.google.com/analytics/bigquery/web-ecommerce-dataset

## Extraction and import

- Observation: 1 November 2020 through 31 January 2021, all 92 days.
- Deterministic whole-visitor sample: `MOD(FARM_FINGERPRINT(user_pseudo_id),200)=0`.
- These are observed sample counts. They are not scaled estimates of store traffic.
- BigQuery job: `job_5jTcz42EtEMdiUUiN1Hfsx2d1H2_`, location US.
- CSV SHA-256: `9df2b3fe73b126bce3dc426660894d0646c1b8d426c7236f841e6365b9e5f6a0`.
- Extraction SQL SHA-256: `ae7620c097880d4f4f4966678deaeb48347637ad0d2f82ec152b50df09261488`.
- Import run: `ef10203d-0b6f-4c13-95f7-ce22c9a3c798`.
- Applied Supabase migrations: `20261116090432_create_tide_analytics_store`,
  `20261116144635_add_tide_report_calculations`.

The unchanged CSV is retained locally under ignored `work/data/ga4-source.csv`.
Raw projected records are retained in the private `tide_raw.event` table with
source row numbers. Neither individual event records nor credentials are bundled
with the website. The committed snapshot contains aggregate reports only.

## Verified import

21,561 source rows and 21,561 clean events; 1,351 unique visitors; 1,875 sessions;
20 unique purchasers. No exact duplicate records, invalid dates, missing visitor
IDs, or inferred sessions occurred in this extraction. 5,639 events have an
unknown traffic source and 4 purchase events lack a transaction ID. These are
retained and reported rather than fabricated or silently reassigned.

The source contains obfuscated and missing fields, and Google cautions that its
internal consistency is limited. This small sample is useful for demonstrating
analysis, not for making claims about the real store or Analytics demo account.

## Metric contract

- Filters use the original GA4 property event date. UTC timestamps order events.
- Visitors are distinct pseudonymous visitor IDs in the selected scope.
- Sessions use the composite visitor ID and GA session ID. The cleaning function
  supports a flagged 30-minute inactivity fallback when session IDs are missing.
- Purchasers are distinct visitors with a purchase event; conversion is that
  count divided by visitors. A missing transaction ID does not erase a purchase.
- Returning visitors appear on at least two distinct dates in the selected scope.
- Each breakdown assigns a visitor to their first recorded segment in that scope,
  with purchase status measured across their scoped events. Device-filter totals
  need not sum to the all-device total when a visitor uses multiple devices.
- Daily unique visitors are not additive across dates.
- The funnel requires view_item, add_to_cart, begin_checkout and purchase in order
  in the same session, allowing equal timestamps. Each step counts distinct
  visitors who reach that depth in at least one session. Purchases with missing
  earlier steps count in total purchasers but not in the complete ordered funnel.
- Cohorts begin at the first observation in this dataset, grouped in Monday
  calendar weeks. The selected period chooses first-observed visitors; follow-up
  continues through the dataset end. Device selection applies to first-observed
  device and matching later activity. Week 0 is 100%; later weeks are included
  only when their full calendar week is observable. Rates are cohort-size weighted.

`sql/postgres/reports.sql` is the report calculation source. The server queries
Supabase with parameterized SQL and returns aggregates only. If the database is
unreachable, it serves the verified `src/lib/analytics-snapshot.json` export and
labels it “Saved Supabase report”. It never substitutes invented counts.

## Validation

All 16 device/period combinations were checked for breakdown totals, purchaser
totals, funnel monotonicity, calendar-day coverage and valid cohort percentages.
Independent SQL verified the import totals. Private tables have RLS enabled and
deny direct SELECT to anon/authenticated roles. The security advisor reported
only informational notices for their intentional lack of public policies.
