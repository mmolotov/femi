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
