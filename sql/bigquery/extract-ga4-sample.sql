-- Source: https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset
-- Deterministic 0.5% visitor sample; keep every event for sampled IDs over all 92 days.
-- Do not replace this with LIMIT or event-level sampling: that breaks funnels and retention.
-- Run in US, use Standard SQL, and set maximum bytes billed to 10,000,000,000.
SELECT
  TO_HEX(SHA256(TO_JSON_STRING(t))) AS event_key,
  event_date AS source_event_date,
  CAST(event_timestamp AS STRING) AS event_timestamp_micros,
  event_name,
  user_pseudo_id,
  (SELECT COALESCE(CAST(p.value.int_value AS STRING), p.value.string_value)
   FROM UNNEST(event_params) p WHERE p.key = 'ga_session_id' LIMIT 1) AS ga_session_id,
  (SELECT COUNTIF(p.key = 'ga_session_id') FROM UNNEST(event_params) p) AS session_parameter_count,
  device.category AS device_category,
  geo.country AS country,
  traffic_source.source AS traffic_source,
  traffic_source.medium AS traffic_medium,
  ecommerce.transaction_id AS transaction_id,
  ecommerce.purchase_revenue AS purchase_revenue,
  event_value_in_usd,
  (SELECT p.value.string_value FROM UNNEST(event_params) p WHERE p.key = 'currency' LIMIT 1) AS currency,
  CAST(event_bundle_sequence_id AS STRING) AS event_bundle_sequence_id
FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*` t
WHERE _TABLE_SUFFIX BETWEEN '20201101' AND '20210131'
  AND NULLIF(TRIM(user_pseudo_id), '') IS NOT NULL
  AND MOD(FARM_FINGERPRINT(user_pseudo_id), 200) = 0
ORDER BY event_timestamp, event_key;
