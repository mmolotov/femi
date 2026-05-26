// Plain read-only Postgres aggregations for the monitoring dashboard. Kept inline
// so the tsc build needs no asset-copy step; edit the SQL here and reference each
// query from config.ts.

export const activityByDaySql = `
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
  to_char(activity_day, 'YYYY-MM-DD') as activity_day,
  activity_type,
  events_count,
  active_users,
  false as is_placeholder
from aggregated

union all

select
  to_char(current_date, 'YYYY-MM-DD') as activity_day,
  'No activity yet' as activity_type,
  0::bigint as events_count,
  0::bigint as active_users,
  true as is_placeholder
where not exists (select 1 from aggregated)

order by 1, 2;
`;

export const activityWindowsSql = `
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
`;

export const dailyCheckinFieldCompletionSql = `
with stats as (
  select
    count(*) as total_rows,
    count(mood) as mood_filled,
    count(energy) as energy_filled,
    count(pain_level) as pain_level_filled,
    count(sleep_quality) as sleep_quality_filled,
    sum(case when discharge is not null and btrim(discharge) <> '' then 1 else 0 end) as discharge_filled,
    sum(case when note is not null and btrim(note) <> '' then 1 else 0 end) as note_filled
  from daily_checkins
)
select
  field_name,
  filled_rows,
  round(100.0 * filled_rows / nullif(total_rows, 0), 1) as fill_rate_pct
from (
  select 'Mood' as field_name, mood_filled as filled_rows, total_rows from stats
  union all
  select 'Energy' as field_name, energy_filled as filled_rows, total_rows from stats
  union all
  select 'Pain level' as field_name, pain_level_filled as filled_rows, total_rows from stats
  union all
  select 'Sleep quality' as field_name, sleep_quality_filled as filled_rows, total_rows from stats
  union all
  select 'Discharge' as field_name, discharge_filled as filled_rows, total_rows from stats
  union all
  select 'Note' as field_name, note_filled as filled_rows, total_rows from stats
) field_stats
order by fill_rate_pct desc, field_name;
`;

export const newUsersByDaySql = `
with signups as (
  select
    date_trunc('day', created_at)::date as signup_day,
    count(*) as new_users
  from users
  where created_at >= current_date - interval '59 days'
  group by 1
)
select
  to_char(signup_day, 'YYYY-MM-DD') as signup_day,
  new_users,
  false as is_placeholder
from signups

union all

select
  to_char(current_date, 'YYYY-MM-DD') as signup_day,
  0::bigint as new_users,
  true as is_placeholder
where not exists (select 1 from signups)

order by 1;
`;

export const newUsersByWeekSql = `
with signups as (
  select
    date_trunc('week', created_at)::date as signup_week,
    count(*) as new_users
  from users
  where created_at >= current_date - interval '111 days'
  group by 1
)
select
  to_char(signup_week, 'YYYY-MM-DD') as signup_week,
  new_users,
  false as is_placeholder
from signups

union all

select
  to_char(date_trunc('week', current_date)::date, 'YYYY-MM-DD') as signup_week,
  0::bigint as new_users,
  true as is_placeholder
where not exists (select 1 from signups)

order by 1;
`;

export const notificationJobStatusesSql = `
with aggregated as (
  select
    status,
    count(*) as job_count,
    count(distinct user_id) as unique_users,
    count(*) filter (where scheduled_for >= now() - interval '30 days') as jobs_last_30d,
    count(*) filter (where sent_at >= now() - interval '30 days') as sent_last_30d
  from notification_jobs
  group by 1
)
select
  status,
  job_count,
  unique_users,
  jobs_last_30d,
  sent_last_30d,
  false as is_placeholder
from aggregated

union all

select
  'No jobs yet' as status,
  0::bigint as job_count,
  0::bigint as unique_users,
  0::bigint as jobs_last_30d,
  0::bigint as sent_last_30d,
  true as is_placeholder
where not exists (select 1 from aggregated)

order by job_count desc, status;
`;

export const overviewTotalsSql = `
with tracking_users as (
  select distinct user_id from period_logs
  union
  select distinct user_id from daily_checkins
  union
  select distinct user_id from symptom_logs
  union
  select distinct user_id from notes
  union
  select distinct user_id from contraception_logs
)
select
  count(*) as total_users,
  count(*) filter (where coalesce(us.onboarding_completed, false)) as onboarded_users,
  round(
    100.0 * count(*) filter (where coalesce(us.onboarding_completed, false)) / nullif(count(*), 0),
    1
  ) as onboarding_completion_rate_pct,
  count(*) filter (where coalesce(us.reminders_enabled, false)) as reminders_enabled_users,
  round(
    100.0 * count(*) filter (where coalesce(us.reminders_enabled, false)) / nullif(count(*), 0),
    1
  ) as reminders_enabled_rate_pct,
  count(*) filter (where tu.user_id is not null) as users_with_any_tracking,
  round(
    100.0 * count(*) filter (where tu.user_id is not null) / nullif(count(*), 0),
    1
  ) as users_with_any_tracking_rate_pct
from users u
left join user_settings us on us.user_id = u.id
left join tracking_users tu on tu.user_id = u.id;
`;

export const topSymptoms30dSql = `
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
`;

export const trackingMixSql = `
with user_flags as (
  select
    u.id as user_id,
    exists(select 1 from period_logs pl where pl.user_id = u.id) as has_period_logs,
    exists(select 1 from daily_checkins dc where dc.user_id = u.id) as has_daily_checkins,
    exists(select 1 from symptom_logs sl where sl.user_id = u.id) as has_symptom_logs,
    exists(select 1 from notes n where n.user_id = u.id) as has_notes,
    exists(select 1 from contraception_logs cl where cl.user_id = u.id) as has_contraception_logs
  from users u
),
classified as (
  select
    case
      when not (
        has_period_logs
        or has_daily_checkins
        or has_symptom_logs
        or has_notes
        or has_contraception_logs
      ) then 'No tracked entries'
      when has_period_logs
        and not (has_daily_checkins or has_symptom_logs or has_notes or has_contraception_logs)
        then 'Period-only trackers'
      when has_period_logs
        and has_daily_checkins
        and not (has_symptom_logs or has_notes or has_contraception_logs)
        then 'Period + daily check-ins'
      when has_period_logs
        and (has_symptom_logs or has_notes or has_contraception_logs)
        then 'Period + richer tracking'
      else 'Non-period tracking only'
    end as tracker_segment
  from user_flags
),
aggregated as (
  select
    tracker_segment,
    count(*) as user_count,
    round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1) as share_pct
  from classified
  group by 1
)
select
  tracker_segment,
  user_count,
  share_pct,
  false as is_placeholder
from aggregated

union all

select
  'No users yet' as tracker_segment,
  0::bigint as user_count,
  0::numeric as share_pct,
  true as is_placeholder
where not exists (select 1 from aggregated)

order by user_count desc, tracker_segment;
`;
