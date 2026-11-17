-- Metrics use GA4 property dates. Counts are observed sample counts, never population estimates.
create function tide_analytics.period_report(p_device text,p_start date,p_end date) returns jsonb
language sql stable security invoker set search_path = '' as $$
with meta as materialized (
 select * from tide_analytics.dataset_run where is_active and status='ready'
), events as materialized (
 select e.* from tide_analytics.event e join meta m on m.id=e.run_id
 where e.event_date between p_start and p_end and (p_device='All devices' or e.device=p_device)
), people as materialized (
 select visitor_id,bool_or(event_name='purchase') purchased,count(distinct event_date)>1 returned
 from events group by visitor_id
), counts as (
 select count(*) visitors,count(*) filter(where purchased) purchasers,count(*) filter(where returned) returned from people
), first_segment as (
 select distinct on(e.visitor_id) e.visitor_id,e.device,e.traffic_source,e.country,p.purchased
 from events e join people p using(visitor_id) order by e.visitor_id,e.event_ts,e.event_key
), segment_counts as (
 select dimension,name,count(*) visitors,count(*) filter(where purchased) purchasers
 from first_segment cross join lateral (values ('Device',device),('Traffic source',traffic_source),('Country',country)) d(dimension,name)
 group by dimension,name
), segments as (
 select dimension,jsonb_agg(jsonb_build_object('name',name,'visitors',s.visitors,'purchasers',s.purchasers,
 'share',coalesce(s.visitors::numeric/nullif(c.visitors,0),0),'rate',coalesce(s.purchasers::numeric/nullif(s.visitors,0),0)) order by s.visitors desc,name) items
 from segment_counts s cross join counts c group by dimension
), session_views as (
 select visitor_id,session_key,min(event_ts) viewed from events where event_name='view_item' group by visitor_id,session_key
), session_carts as (
 select s.*,a.added from session_views s left join lateral (
 select min(event_ts) added from events e where e.visitor_id=s.visitor_id and e.session_key=s.session_key and e.event_name='add_to_cart' and e.event_ts>=s.viewed
 ) a on true
), session_checkouts as (
 select s.*,a.checkout from session_carts s left join lateral (
 select min(event_ts) checkout from events e where e.visitor_id=s.visitor_id and e.session_key=s.session_key and e.event_name='begin_checkout' and e.event_ts>=s.added
 ) a on true
), session_purchases as (
 select s.*,a.purchased from session_checkouts s left join lateral (
 select min(event_ts) purchased from events e where e.visitor_id=s.visitor_id and e.session_key=s.session_key and e.event_name='purchase' and e.event_ts>=s.checkout
 ) a on true
), funnel as (
 select count(distinct visitor_id) viewed,count(distinct visitor_id) filter(where added is not null) added,
 count(distinct visitor_id) filter(where checkout is not null) checkout,count(distinct visitor_id) filter(where purchased is not null) purchased from session_purchases
), first_devices as (
 select distinct on(e.visitor_id) e.visitor_id,e.device from tide_analytics.event e join meta m on m.id=e.run_id order by e.visitor_id,e.event_ts,e.event_key
), cohort_people as materialized (
 select v.visitor_id,date_trunc('week',v.first_seen_date)::date start from tide_analytics.visitor v join meta m on m.id=v.run_id
 join first_devices d using(visitor_id)
 where v.first_seen_date between p_start and p_end and (p_device='All devices' or d.device=p_device)
), cohort_sizes as (
 select start,count(*) size from cohort_people group by start
), cohort_activity as (
 select distinct c.visitor_id,c.start,((date_trunc('week',e.event_date)::date-c.start)/7)::integer week
 from cohort_people c join tide_analytics.event e using(visitor_id) join meta m on m.id=e.run_id
 where p_device='All devices' or e.device=p_device
), cohort_weeks as (
 select c.start,c.size,w.week,case when w.week=0 then 100::numeric else 100*count(distinct a.visitor_id)::numeric/c.size end rate
 from cohort_sizes c cross join meta m cross join generate_series(0,6) w(week)
 left join cohort_activity a on a.start=c.start and a.week=w.week
 where w.week=0 or c.start+w.week*7+6<=m.observation_end
 group by c.start,c.size,w.week
), cohort_rows as (
 select start,size,jsonb_agg(rate order by week) weeks from cohort_weeks group by start,size
), day_counts as (
 select event_date,count(distinct visitor_id) visitors from events group by event_date
)
select jsonb_build_object(
 'days',p_end-p_start+1,
 'totals',jsonb_build_object('visitors',c.visitors,'sessions',(select count(distinct (visitor_id,session_key)) from events),'purchasers',c.purchasers,
 'rate',coalesce(c.purchasers::numeric/nullif(c.visitors,0),0),'returning',c.returned,'returningShare',coalesce(c.returned::numeric/nullif(c.visitors,0),0)),
 'daily',(select jsonb_agg(jsonb_build_object('date',d.day::date,'visitors',coalesce(v.visitors,0)) order by d.day) from generate_series(p_start::timestamp,p_end::timestamp,interval '1 day') d(day) left join day_counts v on v.event_date=d.day::date),
 'funnel',jsonb_build_array(jsonb_build_object('name','Viewed a product','people',f.viewed),jsonb_build_object('name','Added to cart','people',f.added),jsonb_build_object('name','Began checkout','people',f.checkout),jsonb_build_object('name','Purchased','people',f.purchased)),
 'segments',jsonb_build_object('Device',coalesce((select items from segments where dimension='Device'),'[]'::jsonb),'Traffic source',coalesce((select items from segments where dimension='Traffic source'),'[]'::jsonb),'Country',coalesce((select items from segments where dimension='Country'),'[]'::jsonb)),
 'cohorts',coalesce((select jsonb_agg(jsonb_build_object('start',start,'size',size,'weeks',weeks) order by start) from cohort_rows),'[]'::jsonb),
 'dataset',jsonb_build_object('runId',m.id,'source','Google GA4 sample','sourceUrl',m.source_url,'sampleRate',1::numeric/m.sample_modulus,'start',m.observation_start,'end',m.observation_end,'events',(m.quality->>'cleanEvents')::integer,'quality',m.quality)
) from counts c cross join funnel f cross join meta m;
$$;
revoke all on function tide_analytics.period_report(text,date,date) from public,anon,authenticated;
