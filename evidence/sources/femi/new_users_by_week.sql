with signups as (
  select
    date_trunc('week', created_at)::date as signup_week,
    count(*) as new_users
  from users
  where created_at >= current_date - interval '111 days'
  group by 1
)
select
  signup_week,
  new_users,
  false as is_placeholder
from signups

union all

select
  date_trunc('week', current_date)::date as signup_week,
  0::bigint as new_users,
  true as is_placeholder
where not exists (select 1 from signups)

order by 1;
