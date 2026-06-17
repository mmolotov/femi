SELECT format(
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'monitoring_db_user')
      THEN 'ALTER ROLE %I WITH LOGIN PASSWORD %L'
    ELSE 'CREATE ROLE %I LOGIN PASSWORD %L'
  END,
  :'monitoring_db_user',
  :'monitoring_db_password'
)
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'database_name', :'monitoring_db_user')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'monitoring_db_user')
\gexec

SELECT format(
  'GRANT SELECT ON TABLE %s TO %I',
  string_agg(format('public.%I', table_name), ', ' ORDER BY table_name),
  :'monitoring_db_user'
)
FROM (
  VALUES
    ('users'),
    ('user_settings'),
    ('cycles'),
    ('period_logs'),
    ('daily_checkins'),
    ('symptom_logs'),
    ('notes'),
    ('reminders'),
    ('notification_jobs'),
    ('contraception_logs'),
    ('metric_snapshots')
) AS tables(table_name)
\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT ON TABLES TO %I',
  :'db_owner_role',
  :'monitoring_db_user'
)
\gexec
