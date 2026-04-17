with all_activity as (
  select user_id, happened_on::date as activity_day, 'period_logs' as source
  from period_logs
  union all
  select user_id, happened_on::date as activity_day, 'daily_checkins' as source
  from daily_checkins
  union all
  select user_id, happened_on::date as activity_day, 'symptom_logs' as source
  from symptom_logs
  union all
  select user_id, coalesce(happened_on, created_at::date) as activity_day, 'notes' as source
  from notes
  union all
  select user_id, happened_on::date as activity_day, 'contraception_logs' as source
  from contraception_logs
  union all
  select user_id, created_at::date as activity_day, 'reminders' as source
  from reminders
)
select
  count(distinct user_id) filter (where activity_day >= current_date) as active_1d,
  count(distinct user_id) filter (where activity_day >= current_date - interval '6 days') as active_7d,
  count(distinct user_id) filter (where activity_day >= current_date - interval '29 days') as active_30d,
  count(distinct user_id) filter (where source = 'period_logs') as users_with_period_logs,
  count(distinct user_id) filter (where source = 'daily_checkins') as users_with_daily_checkins,
  count(distinct user_id) filter (where source = 'symptom_logs') as users_with_symptom_logs,
  count(distinct user_id) filter (where source = 'notes') as users_with_notes,
  count(distinct user_id) filter (where source = 'contraception_logs') as users_with_contraception_logs,
  count(distinct user_id) filter (where source = 'reminders') as users_with_reminders
from all_activity;
