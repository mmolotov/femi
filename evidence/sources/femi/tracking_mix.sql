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
