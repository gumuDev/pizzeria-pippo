-- Add kitchen late threshold setting
INSERT INTO app_settings (key, value, updated_at)
VALUES ('kitchen_late_threshold_minutes', '10', now())
ON CONFLICT (key) DO NOTHING;
