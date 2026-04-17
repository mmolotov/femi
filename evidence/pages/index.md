---
title: Femi Product Overview
---

This Evidence site reads directly from raw `femi` product tables with a dedicated
read-only PostgreSQL user. The goal of the first iteration is to answer core
product questions without inventing an analytics warehouse first.

```sql overview_totals
  select *
  from femi.overview_totals
```

## Core KPIs

<BigValue data={overview_totals} value=total_users title="Total users" fmt=num0 />

<BigValue data={overview_totals} value=onboarded_users title="Onboarded users" fmt=num0 />

<BigValue
  data={overview_totals}
  value=onboarding_completion_rate_pct
  title="Onboarding completion (%)"
  fmt=num1
/>

<BigValue data={overview_totals} value=reminders_enabled_users title="Users with reminders enabled" fmt=num0 />

<BigValue data={overview_totals} value=users_with_any_tracking title="Users with any tracking data" fmt=num0 />

```sql new_users_by_day
  select signup_day, new_users
  from femi.new_users_by_day
  where not is_placeholder
```

## User Growth

{#if new_users_by_day?.length}
<LineChart
  data={new_users_by_day}
  title="New users per day (last 60 days)"
  x=signup_day
  y=new_users
/>
{:else}
No user signups were recorded in the last 60 days.
{/if}

```sql new_users_by_week
  select signup_week, new_users
  from femi.new_users_by_week
  where not is_placeholder
```

{#if new_users_by_week?.length}
<BarChart data={new_users_by_week} title="New users per week" x=signup_week y=new_users />
{:else}
No weekly signup data is available yet.
{/if}

```sql activity_windows
  select *
  from femi.activity_windows
```

## Recent Activity Reach

<BigValue data={activity_windows} value=active_1d title="Users active today" fmt=num0 />

<BigValue data={activity_windows} value=active_7d title="Users active in 7 days" fmt=num0 />

<BigValue data={activity_windows} value=active_30d title="Users active in 30 days" fmt=num0 />

<DataTable data={activity_windows} title="Tracking reach by data type" />
