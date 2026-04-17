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
