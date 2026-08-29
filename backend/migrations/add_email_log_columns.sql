-- Migration: Add email delivery tracking columns to email_logs
-- Run this in Supabase SQL Editor (dashboard → SQL Editor → New Query)

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS type        TEXT    DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS job_id      TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS message_id  TEXT    DEFAULT NULL;

-- Create index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_status  ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type    ON email_logs(type);

-- Verify
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_name = 'email_logs'
ORDER  BY ordinal_position;
