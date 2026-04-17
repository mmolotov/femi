---
title: Tracking Quality
---

This section shows what people actually log, whether they stay in a period-only
mode, and how complete the daily check-in payloads are.

```sql tracking_mix
  select tracker_segment, user_count, share_pct
  from femi.tracking_mix
  where not is_placeholder
```

## Tracking Mix

{#if tracking_mix?.length}
<BarChart
  data={tracking_mix}
  title="User segmentation by tracking depth"
  x=tracker_segment
  y=user_count
  swapXY=true
/>

<DataTable data={tracking_mix} title="Tracking mix by user segment" />
{:else}
No tracked user activity is available yet.
{/if}

```sql daily_checkin_field_completion
  select *
  from femi.daily_checkin_field_completion
```

## Daily Check-In Field Completion

<BarChart
  data={daily_checkin_field_completion}
  title="How often each daily check-in field is filled"
  x=field_name
  y=fill_rate_pct
  swapXY=true
/>

<DataTable data={daily_checkin_field_completion} title="Daily check-in completion rates" />
