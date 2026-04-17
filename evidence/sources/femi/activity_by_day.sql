with all_activity as (
  select happened_on::date as activity_day, user_id, 'period_logs' as activity_type
  from period_logs
  where happened_on >= current_date - interval '29 days'
  union all
  select happened_on::date as activity_day, user_id, 'daily_checkins' as activity_type
  from daily_checkins
  where happened_on >= current_date - interval '29 days'
  union all
  select happened_on::date as activity_day, user_id, 'symptom_logs' as activity_type
  from symptom_logs
  where happened_on >= current_date - interval '29 days'
  union all
  select coalesce(happened_on, created_at::date) as activity_day, user_id, 'notes' as activity_type
  from notes
  where coalesce(happened_on, created_at::date) >= current_date - interval '29 days'
  union all
  select happened_on::date as activity_day, user_id, 'contraception_logs' as activity_type
  from contraception_logs
  where happened_on >= current_date - interval '29 days'
),
aggregated as (
  select
    activity_day,
    activity_type,
    count(*) as events_count,
    count(distinct user_id) as active_users
  from all_activity
  group by 1, 2
)
select
  activity_day,
  activity_type,
  events_count,
  active_users,
  false as is_placeholder
from aggregated

union all

select
  current_date as activity_day,
  'No activity yet' as activity_type,
  0::bigint as events_count,
  0::bigint as active_users,
  true as is_placeholder
where not exists (select 1 from aggregated)

order by 1, 2;
