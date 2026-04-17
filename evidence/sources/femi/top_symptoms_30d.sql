with ranked as (
  select
    symptom_key,
    count(*) as logged_events,
    count(distinct user_id) as unique_users
  from symptom_logs
  where happened_on >= current_date - interval '29 days'
  group by 1
  order by logged_events desc, unique_users desc, symptom_key
  limit 10
)
select
  symptom_key,
  logged_events,
  unique_users,
  false as is_placeholder
from ranked

union all

select
  'No symptoms yet' as symptom_key,
  0::bigint as logged_events,
  0::bigint as unique_users,
  true as is_placeholder
where not exists (select 1 from ranked)

order by logged_events desc, unique_users desc, symptom_key;
