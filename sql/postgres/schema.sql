-- Private, versioned analytics store. Access is through the server-side report API.
create schema if not exists tide_raw;
create schema if not exists tide_analytics;
revoke all on schema tide_raw, tide_analytics from public, anon, authenticated;

create table tide_analytics.dataset_run (
  id uuid primary key default gen_random_uuid(),
  source_dataset text not null,
  source_url text not null,
  source_job_id text,
  source_file_sha256 text not null check (source_file_sha256 ~ '^[a-f0-9]{64}$'),
  extraction_sql_sha256 text not null check (extraction_sql_sha256 ~ '^[a-f0-9]{64}$'),
  sample_modulus integer not null check (sample_modulus > 0),
  sample_bucket integer not null,
  observation_start date not null,
  observation_end date not null,
  expected_rows integer not null check (expected_rows > 0),
  imported_rows integer not null default 0,
  status text not null default 'loading' check (status in ('loading','ready','failed')),
  is_active boolean not null default false,
  quality jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  check (sample_bucket >= 0 and sample_bucket < sample_modulus),
  check (observation_end >= observation_start),
  check (not is_active or status = 'ready')
);
create unique index dataset_run_one_active on tide_analytics.dataset_run(is_active) where is_active;
alter table tide_analytics.dataset_run enable row level security;

create table tide_raw.event (
  run_id uuid not null references tide_analytics.dataset_run(id),
  source_row integer not null check (source_row > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key(run_id,source_row)
);
alter table tide_raw.event enable row level security;

create table tide_analytics.event (
  run_id uuid not null references tide_analytics.dataset_run(id),
  event_key text not null,
  event_date date not null,
  event_ts timestamptz not null,
  event_name text not null,
  visitor_id text not null,
  session_key text not null,
  session_inferred boolean not null,
  device text not null,
  country text not null,
  traffic_source text not null,
  traffic_medium text not null,
  transaction_id text,
  primary key(run_id,event_key)
);
create index event_date_device on tide_analytics.event(run_id,event_date,device) include(visitor_id,event_name,session_key,event_ts);
create index event_visitor_time on tide_analytics.event(run_id,visitor_id,event_ts);
alter table tide_analytics.event enable row level security;

create table tide_analytics.visitor (
  run_id uuid not null references tide_analytics.dataset_run(id),
  visitor_id text not null,
  first_seen_date date not null,
  last_seen_date date not null,
  first_seen_at timestamptz not null,
  event_count integer not null,
  primary key(run_id,visitor_id)
);
create index visitor_first_seen on tide_analytics.visitor(run_id,first_seen_date);
alter table tide_analytics.visitor enable row level security;

create table tide_analytics.visit_session (
  run_id uuid not null references tide_analytics.dataset_run(id),
  visitor_id text not null,
  session_key text not null,
  inferred boolean not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  event_count integer not null,
  primary key(run_id,visitor_id,session_key)
);
alter table tide_analytics.visit_session enable row level security;

create function tide_analytics.safe_event_date(value text) returns date
language plpgsql immutable security invoker set search_path = '' as $$
declare parsed date;
begin
  if value !~ '^[0-9]{8}$' then return null; end if;
  parsed := to_date(value,'YYYYMMDD');
  if to_char(parsed,'YYYYMMDD') <> value then return null; end if;
  return parsed;
exception when others then return null;
end;
$$;

create function tide_analytics.refresh_models(p_run uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare meta tide_analytics.dataset_run%rowtype; actual integer; kept integer; audit jsonb;
begin
  select * into strict meta from tide_analytics.dataset_run where id=p_run for update;
  if meta.status <> 'loading' then raise exception 'Only a loading dataset can be rebuilt'; end if;
  select count(*) into actual from tide_raw.event where run_id=p_run;
  if actual <> meta.expected_rows then raise exception 'Incomplete import: expected %, got %',meta.expected_rows,actual; end if;

  delete from tide_analytics.event where run_id=p_run;
  delete from tide_analytics.visitor where run_id=p_run;
  delete from tide_analytics.visit_session where run_id=p_run;

  with parsed as (
    select source_row, payload,
      nullif(btrim(payload->>'event_key'),'') as event_key,
      tide_analytics.safe_event_date(payload->>'source_event_date') as event_date,
      case when payload->>'event_timestamp_micros' ~ '^[0-9]{1,16}$'
        then to_timestamp((payload->>'event_timestamp_micros')::numeric/1000000) end as event_ts,
      nullif(btrim(payload->>'user_pseudo_id'),'') as visitor_id,
      nullif(btrim(payload->>'event_name'),'') as event_name
    from tide_raw.event where run_id=p_run
  ), valid as (
    select *,row_number() over(partition by event_key order by source_row) as duplicate_rank
    from parsed
    where event_key ~ '^[A-Fa-f0-9]{64}$'
      and visitor_id is not null and visitor_id not in ('<Other>','(not set)')
      and event_name is not null
      and event_date between meta.observation_start and meta.observation_end
      and event_ts between (meta.observation_start-1)::timestamptz and (meta.observation_end+2)::timestamptz
  ), ordered as (
    select *,lag(event_ts) over(partition by visitor_id order by event_ts,event_key) as previous_ts
    from valid where duplicate_rank=1
  ), sessions as (
    select *,sum(case when previous_ts is null or event_ts-previous_ts>interval '30 minutes' then 1 else 0 end)
      over(partition by visitor_id order by event_ts,event_key) as inferred_session,
      case when payload->>'ga_session_id' ~ '^[0-9]+$' and payload->>'ga_session_id' !~ '^0+$'
        then payload->>'ga_session_id' end as ga_id
    from ordered
  )
  insert into tide_analytics.event
  select p_run,event_key,event_date,event_ts,event_name,visitor_id,
    coalesce('ga:'||ga_id,'inferred:'||inferred_session::text),ga_id is null,
    case lower(btrim(payload->>'device_category')) when 'desktop' then 'Desktop' when 'mobile' then 'Mobile' when 'tablet' then 'Tablet' else 'Unknown' end,
    coalesce(nullif(nullif(nullif(btrim(payload->>'country'),''),'<Other>'),'(not set)'),'Unknown'),
    case when payload->>'traffic_source'='(direct)' then 'Direct' else coalesce(nullif(nullif(nullif(btrim(payload->>'traffic_source'),''),'<Other>'),'(not set)'),'Unknown') end,
    coalesce(nullif(nullif(nullif(btrim(payload->>'traffic_medium'),''),'<Other>'),'(not set)'),'Unknown'),
    nullif(nullif(nullif(btrim(payload->>'transaction_id'),''),'<Other>'),'(not set)')
  from sessions;
  get diagnostics kept = row_count;
  if kept=0 then raise exception 'No valid events remain after cleaning'; end if;

  insert into tide_analytics.visitor
  select p_run,visitor_id,min(event_date),max(event_date),min(event_ts),count(*)::integer
  from tide_analytics.event where run_id=p_run group by visitor_id;
  insert into tide_analytics.visit_session
  select p_run,visitor_id,session_key,bool_or(session_inferred),min(event_ts),max(event_ts),count(*)::integer
  from tide_analytics.event where run_id=p_run group by visitor_id,session_key;

  select jsonb_build_object(
    'rawRows',actual,'cleanEvents',kept,'removedRows',actual-kept,
    'exactDuplicateRows',(select count(*)-count(distinct payload->>'event_key') from tide_raw.event where run_id=p_run),
    'eventsWithMissingVisitor',(select count(*) from tide_raw.event where run_id=p_run and nullif(btrim(payload->>'user_pseudo_id'),'') is null),
    'eventsWithInvalidDate',(select count(*) from tide_raw.event where run_id=p_run and tide_analytics.safe_event_date(payload->>'source_event_date') is null),
    'eventsWithInferredSession',(select count(*) from tide_analytics.event where run_id=p_run and session_inferred),
    'eventsWithDuplicateSessionParameter',(select count(*) from tide_raw.event where run_id=p_run and payload->>'session_parameter_count' ~ '^[0-9]+$' and (payload->>'session_parameter_count')::integer>1),
    'visitors',(select count(*) from tide_analytics.visitor where run_id=p_run),
    'sessions',(select count(*) from tide_analytics.visit_session where run_id=p_run),
    'days',(select count(distinct event_date) from tide_analytics.event where run_id=p_run),
    'unknownDeviceEvents',(select count(*) from tide_analytics.event where run_id=p_run and device='Unknown'),
    'unknownSourceEvents',(select count(*) from tide_analytics.event where run_id=p_run and traffic_source='Unknown'),
    'purchaseEventsWithoutTransactionId',(select count(*) from tide_analytics.event where run_id=p_run and event_name='purchase' and transaction_id is null)
  ) into audit;
  update tide_analytics.dataset_run set is_active=false where is_active;
  update tide_analytics.dataset_run set imported_rows=actual,status='ready',is_active=true,quality=audit,ready_at=now() where id=p_run;
  return audit;
end;
$$;

revoke all on all tables in schema tide_raw,tide_analytics from public,anon,authenticated;
revoke all on all functions in schema tide_analytics from public,anon,authenticated;
