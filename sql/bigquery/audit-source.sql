-- Execute independently when source-wide quality totals are needed.
SELECT
  COUNT(*) AS source_events,
  COUNT(DISTINCT user_pseudo_id) AS source_visitors,
  COUNT(DISTINCT event_date) AS source_days,
  COUNTIF(NULLIF(TRIM(user_pseudo_id), '') IS NULL) AS events_without_visitor_id,
  COUNTIF(SAFE.PARSE_DATE('%Y%m%d', event_date) IS NULL) AS invalid_event_dates,
  MIN(event_date) AS first_date,
  MAX(event_date) AS last_date
FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
WHERE _TABLE_SUFFIX BETWEEN '20201101' AND '20210131';
