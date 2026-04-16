DO $metabase$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'metabase_db_user') THEN
    EXECUTE format(
      'CREATE ROLE %I LOGIN PASSWORD %L',
      :'metabase_db_user',
      :'metabase_db_password'
    );
  ELSE
    EXECUTE format(
      'ALTER ROLE %I WITH LOGIN PASSWORD %L',
      :'metabase_db_user',
      :'metabase_db_password'
    );
  END IF;
END
$metabase$;

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'database_name', :'metabase_db_user')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'metabase_db_user')
\gexec

SELECT format(
  'GRANT SELECT ON TABLE %s TO %I',
  string_agg(format('public.%I', table_name), ', ' ORDER BY table_name),
  :'metabase_db_user'
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
    ('contraception_logs')
) AS tables(table_name)
\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT ON TABLES TO %I',
  :'db_owner_role',
  :'metabase_db_user'
)
\gexec
