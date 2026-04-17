---
title: Activity and Adoption
---

These views focus on who is actually using the tracker and which parts of the
product they touch over time.

```sql activity_windows
  select *
  from femi.activity_windows
```

## Tracking Footprint

<DataTable data={activity_windows} title="Users reached by each tracking surface" />

```sql activity_by_day
  select activity_day, activity_type, events_count, active_users
  from femi.activity_by_day
  where not is_placeholder
```

## Daily Tracking Volume

{#if activity_by_day?.length}
<LineChart
  data={activity_by_day}
  title="Daily active users by tracking type (last 30 days)"
  x=activity_day
  y=active_users
  series=activity_type
/>

<DataTable data={activity_by_day} title="Daily activity by type" />
{:else}
No tracking activity was recorded in the last 30 days.
{/if}

```sql top_symptoms_30d
  select symptom_key, logged_events, unique_users
  from femi.top_symptoms_30d
  where not is_placeholder
```

## Top Symptoms

{#if top_symptoms_30d?.length}
<BarChart
  data={top_symptoms_30d}
  title="Most logged symptoms in the last 30 days"
  x=symptom_key
  y=logged_events
  swapXY=true
/>

<DataTable data={top_symptoms_30d} title="Top symptoms in the last 30 days" />
{:else}
No symptom events were logged in the last 30 days.
{/if}

```sql notification_job_statuses
  select status, job_count, unique_users, jobs_last_30d, sent_last_30d
  from femi.notification_job_statuses
  where not is_placeholder
```

## Reminder Delivery

{#if notification_job_statuses?.length}
<BarChart
  data={notification_job_statuses}
  title="Notification jobs by status"
  x=status
  y=job_count
/>

<DataTable data={notification_job_statuses} title="Notification job status breakdown" />
{:else}
No reminder delivery jobs have been recorded yet.
{/if}
