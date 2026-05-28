-- =========================================================
-- CLICKOPTIX AUTO-MIGRATION — Missing Tables (FIXED)
-- users.id is TEXT type — all foreign keys use TEXT
-- Run this in: Supabase Dashboard > SQL Editor
-- =========================================================

-- TABLE: kyc_submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  status                 TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Revision')),
  documents              JSONB DEFAULT '[]'::jsonb,
  submitted_at           TIMESTAMPTZ DEFAULT now(),
  reviewed_at            TIMESTAMPTZ,
  reviewed_by            TEXT,
  rejection_reason       TEXT,
  required_revision_docs INTEGER DEFAULT 0,
  raw_data               JSONB DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.kyc_submissions;
CREATE POLICY "Service role full access" ON public.kyc_submissions USING (true) WITH CHECK (true);
GRANT ALL ON public.kyc_submissions TO service_role;
GRANT SELECT ON public.kyc_submissions TO authenticated;

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
  is_read      BOOLEAN DEFAULT false,
  action_url   TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.notifications;
CREATE POLICY "Service role full access" ON public.notifications USING (true) WITH CHECK (true);
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO authenticated;

-- TABLE: network_devices
CREATE TABLE IF NOT EXISTS public.network_devices (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT DEFAULT 'router' CHECK (type IN ('router','switch','olt','onu','ap','server','other')),
  ip_address   TEXT,
  mac_address  TEXT,
  status       TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','warning','error')),
  location     TEXT,
  user_id      TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  config       JSONB DEFAULT '{}'::jsonb,
  last_seen    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.network_devices;
CREATE POLICY "Service role full access" ON public.network_devices USING (true) WITH CHECK (true);
GRANT ALL ON public.network_devices TO service_role;
GRANT SELECT ON public.network_devices TO authenticated;

-- TABLE: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  ip_hash       TEXT,
  fingerprint   TEXT,
  user_agent    TEXT,
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON public.sessions;
CREATE POLICY "Service role full access" ON public.sessions USING (true) WITH CHECK (true);
GRANT ALL ON public.sessions TO service_role;

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id        ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token  ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_ip      ON public.network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status  ON public.kyc_submissions(status);

-- Fix existing users table — add missing columns if not present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Unverified';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- Soft-delete support (mirrors Firebase/localStorage deleted flag)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index to speed up filtering live (non-deleted) users
CREATE INDEX IF NOT EXISTS idx_users_deleted ON public.users(deleted) WHERE deleted = false;

-- Grant read access for anon on public reference tables
GRANT SELECT ON public.packages TO anon;
GRANT SELECT ON public.system_configs TO anon;

SELECT 'Migration complete! All 4 tables created successfully.' AS result;