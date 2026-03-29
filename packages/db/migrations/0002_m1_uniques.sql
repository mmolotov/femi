CREATE UNIQUE INDEX IF NOT EXISTS cycles_user_started_on_idx
ON cycles (user_id, started_on);

CREATE UNIQUE INDEX IF NOT EXISTS period_logs_user_happened_on_idx
ON period_logs (user_id, happened_on);

CREATE UNIQUE INDEX IF NOT EXISTS daily_checkins_user_happened_on_idx
ON daily_checkins (user_id, happened_on);

CREATE UNIQUE INDEX IF NOT EXISTS symptom_logs_user_happened_on_symptom_idx
ON symptom_logs (user_id, happened_on, symptom_key);
