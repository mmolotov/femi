with signups as (
  select
    date_trunc('day', created_at)::date as signup_day,
    count(*) as new_users
  from users
  where created_at >= current_date - interval '59 days'
  group by 1
)
select
  signup_day,
  new_users,
  false as is_placeholder
from signups

union all

select
  current_date as signup_day,
  0::bigint as new_users,
  true as is_placeholder
where not exists (select 1 from signups)

order by 1;
