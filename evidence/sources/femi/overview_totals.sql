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
