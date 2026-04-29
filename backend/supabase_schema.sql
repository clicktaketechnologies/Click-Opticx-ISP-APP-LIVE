-- ============================================================
-- Click Opticx ISP — Supabase Schema (Phase 0)
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SYSTEM CONFIG ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT UNIQUE NOT NULL,
  value       JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT NOT NULL,
  old_value  JSONB,
  new_value  JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ─── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  connection_id        TEXT,
  name                 TEXT NOT NULL,
  username             TEXT,
  email                TEXT,
  phone                TEXT,
  password             TEXT,
  address              TEXT,
  area                 TEXT,
  subarea              TEXT,
  status               TEXT DEFAULT 'Verification Pending',
  verification_status  TEXT DEFAULT 'Unverified',
  is_kyc_verified      BOOLEAN DEFAULT FALSE,
  is_kyc_submitted     BOOLEAN DEFAULT FALSE,
  kyc_status           TEXT DEFAULT 'pending',
  approval_status      TEXT DEFAULT 'pending',
  package_id           TEXT,
  balance              NUMERIC DEFAULT 0,
  credit_score         INTEGER DEFAULT 600,
  referral_points      INTEGER DEFAULT 0,
  referral_code        TEXT,
  referred_by          TEXT,
  activation_count     INTEGER DEFAULT 0,
  expiry_date          TIMESTAMPTZ,
  activation_date      TIMESTAMPTZ,
  connection_type      TEXT DEFAULT 'Fiber',
  management_mode      TEXT DEFAULT 'Manual',
  nas_connection_type  TEXT DEFAULT 'Manual',
  portal_enabled       BOOLEAN DEFAULT TRUE,
  role                 TEXT DEFAULT 'Customer',
  cnic                 TEXT,
  deleted              BOOLEAN DEFAULT FALSE,
  dealer_id            TEXT,
  reseller_email       TEXT,
  profile_image        TEXT,
  fcm_token            TEXT,
  internal_notes       TEXT,
  tags                 TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  raw_data             JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- ─── STAFF ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          TEXT PRIMARY KEY DEFAULT ('STF-' || extract(epoch from now())::text),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  status      TEXT DEFAULT 'Active',
  password    TEXT,
  balance     NUMERIC DEFAULT 0,
  dealer_code TEXT,
  last_active TIMESTAMPTZ,
  parent_id   TEXT,
  creator_admin_id TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  raw_data    JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- ─── USER ROLES (for RLS) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL,
  granted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ─── PACKAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  subtitle       TEXT,
  speed          TEXT,
  upload_speed   TEXT,
  data_limit     TEXT DEFAULT 'Unlimited',
  price          NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,
  tax_rate       NUMERIC DEFAULT 0,
  duration       INTEGER DEFAULT 30,
  deleted        BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  color          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  raw_data       JSONB DEFAULT '{}'
);

-- ─── SIGNUP REQUESTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS signup_requests (
  id              TEXT PRIMARY KEY,
  user_id         TEXT,
  name            TEXT NOT NULL,
  username        TEXT,
  email           TEXT,
  phone           TEXT,
  cnic            TEXT,
  address         TEXT,
  area            TEXT,
  package_id      TEXT,
  connection_type TEXT,
  status          TEXT DEFAULT 'Pending',
  duplicate_warning BOOLEAN DEFAULT FALSE,
  duplicate_reason  TEXT,
  processed_at    TIMESTAMPTZ,
  processed_by    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  raw_data        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests(status);

-- ─── KYC ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_requests (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  user_name        TEXT,
  status           TEXT DEFAULT 'Pending',
  rejection_reason TEXT,
  face_data        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  raw_data         JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS kyc_files (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  user_name   TEXT,
  kyc_id      TEXT,
  file_name   TEXT NOT NULL,
  file_url    TEXT,
  provider    TEXT,
  status      TEXT DEFAULT 'TEMP',
  file_type   TEXT,
  size        BIGINT,
  checksum    TEXT,
  temp_path   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_files_user_id ON kyc_files(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_files_status ON kyc_files(status);

-- ─── INVOICES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  user_name      TEXT,
  package_id     TEXT,
  package_name   TEXT,
  subtotal       NUMERIC DEFAULT 0,
  tax_rate       NUMERIC DEFAULT 0,
  tax_amount     NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount   NUMERIC DEFAULT 0,
  paid_amount    NUMERIC DEFAULT 0,
  due_amount     NUMERIC DEFAULT 0,
  status         TEXT DEFAULT 'Unpaid',
  due_date       TIMESTAMPTZ,
  paid_at        TIMESTAMPTZ,
  payment_method TEXT,
  type           TEXT DEFAULT 'Monthly',
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  raw_data       JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ─── PAYMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  user_name       TEXT,
  amount          NUMERIC NOT NULL,
  status          TEXT DEFAULT 'Pending',
  method          TEXT,
  invoice_id      TEXT,
  collector_email TEXT,
  collector_name  TEXT,
  collected_by    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  raw_data        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ─── EMERGENCY LOADS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_loads (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  user_name         TEXT,
  amount            NUMERIC NOT NULL,
  status            TEXT DEFAULT 'Pending_Activation',
  expiry_timestamp  TIMESTAMPTZ,
  locked_until      TIMESTAMPTZ,
  repaid            BOOLEAN DEFAULT FALSE,
  source_type       TEXT DEFAULT 'Auto',
  settled_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  raw_data          JSONB DEFAULT '{}'
);

-- ─── TOPUP REQUESTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS topup_requests (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL,
  user_name               TEXT,
  amount                  NUMERIC NOT NULL,
  status                  TEXT DEFAULT 'Pending',
  payment_method          TEXT,
  request_type            TEXT,
  payment_commitment_date DATE,
  rejection_reason        TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  raw_data                JSONB DEFAULT '{}'
);

-- ─── SUPPORT TICKETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  user_name   TEXT,
  subject     TEXT,
  description TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'Open',
  priority    TEXT DEFAULT 'Medium',
  assigned_to TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  closed_at   TIMESTAMPTZ,
  raw_data    JSONB DEFAULT '{}'
);

-- ─── AUDIT LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action      TEXT NOT NULL,
  user_id     TEXT,
  user_name   TEXT,
  admin_id    TEXT,
  admin_name  TEXT,
  details     TEXT,
  type        TEXT,
  ip_address  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(type);

-- ─── SECURITY LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action       TEXT NOT NULL,
  target_id    TEXT,
  target_name  TEXT,
  admin_email  TEXT,
  admin_ip     TEXT,
  admin_browser TEXT,
  details      TEXT,
  risk_level   TEXT DEFAULT 'Low',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EMAIL LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT,
  user_name      TEXT,
  email          TEXT,
  subject        TEXT,
  provider_used  TEXT,
  status         TEXT DEFAULT 'Pending',
  error_message  TEXT,
  retry_count    INTEGER DEFAULT 0,
  template_id    TEXT,
  campaign_id    TEXT,
  trigger_source TEXT DEFAULT 'System',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider_used);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- ─── SYNC AUDIT (migration tracking) ─────────────────────
CREATE TABLE IF NOT EXISTS sync_audit (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name      TEXT NOT NULL,
  firebase_count  INTEGER,
  supabase_count  INTEGER,
  mismatch_count  INTEGER DEFAULT 0,
  health_score    NUMERIC,
  mismatches      JSONB DEFAULT '[]',
  auto_repaired   INTEGER DEFAULT 0,
  checked_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED: Default System Configs ─────────────────────────
INSERT INTO system_configs (key, value, description) VALUES
(
  'email_providers',
  '{
    "providers": [
      {"id": "resend",   "name": "Resend",       "enabled": true,  "priority": 1, "daily_limit": 3000,  "monthly_limit": 100000},
      {"id": "brevo",    "name": "Brevo",         "enabled": true,  "priority": 2, "daily_limit": 300,   "monthly_limit": 9000},
      {"id": "mailgun",  "name": "Mailgun",        "enabled": true,  "priority": 3, "daily_limit": 1000,  "monthly_limit": 10000},
      {"id": "gmail",    "name": "Gmail SMTP",     "enabled": true,  "priority": 4, "daily_limit": 500,   "monthly_limit": 15000}
    ],
    "from_address": "no-reply@clickopticx.com",
    "from_name": "Click Opticx",
    "quiet_hours": {"start": "22:00", "end": "08:00", "enabled": true},
    "duplicate_suppression_hours": 24,
    "rate_limit_per_hour": 500
  }',
  'Email provider priority chain and settings'
),
(
  'storage_providers',
  '{
    "providers": [
      {"id": "cloudinary",       "name": "Cloudinary",       "enabled": true,  "priority": 1, "max_file_mb": 10},
      {"id": "supabase_storage", "name": "Supabase Storage", "enabled": true,  "priority": 2, "max_file_mb": 50},
      {"id": "local",            "name": "Local Fallback",   "enabled": true,  "priority": 3, "max_file_mb": 100}
    ],
    "compression_quality": 85,
    "max_dimension": 2000,
    "allowed_types": ["image/jpeg", "image/png", "application/pdf"],
    "checksum_enabled": true
  }',
  'Storage provider priority chain and settings'
),
(
  'network_providers',
  '{
    "mikrotik": {
      "polling_interval_seconds": 30,
      "retry_max_attempts": 3,
      "retry_backoff_ms": 2000,
      "bandwidth_alert_threshold_percent": 90,
      "enabled": true
    },
    "olt": {
      "heartbeat_interval_seconds": 60,
      "onu_discovery_notify": true,
      "signal_alert_dbm_threshold": -30,
      "los_alert_dbm_threshold": -35,
      "enabled": true
    }
  }',
  'Network device polling and alert settings'
),
(
  'ai_modules',
  '{
    "kill_switch": false,
    "chat": {"enabled": true, "token_limit_per_day": 100000},
    "voice": {"enabled": true, "minutes_limit_per_day": 60},
    "network": {"enabled": true, "confidence_threshold": 0.7},
    "risk": {"enabled": true, "auto_action": false}
  }',
  'AI module toggles and limits'
),
(
  'migration_control',
  '{
    "dual_write_enabled": true,
    "firebase_mode": "readwrite",
    "primary_source": "firebase",
    "phase": 0,
    "started_at": null,
    "notes": "Phase 0 - Adapter layer active"
  }',
  'Migration phase control flags'
),
(
  'system_modules',
  '{
    "auth": {
      "google_oauth": true,
      "phone_otp": true,
      "face_reset": true,
      "two_fa": false,
      "session_timeout_hours": 168
    },
    "kyc": {
      "auto_enforcement": true,
      "revision_workflow": true,
      "retention_days": 2555,
      "compression_quality": 85
    },
    "billing": {
      "auto_suspend_on_expiry": true,
      "emergency_lock_hours": 72,
      "credit_score_update_frequency": "on_payment"
    },
    "pwa": {
      "offline_queue_max": 50,
      "sync_retry_interval_ms": 30000,
      "cache_expiration_hours": 24
    }
  }',
  'System module configuration'
)
ON CONFLICT (key) DO NOTHING;

-- ─── ENABLE REALTIME on system_configs ────────────────────
ALTER TABLE system_configs REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;
ALTER TABLE email_logs REPLICA IDENTITY FULL;
ALTER TABLE sync_audit REPLICA IDENTITY FULL;

-- ─── MIGRATION STATS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS migration_stats (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id     TEXT NOT NULL,
  collection   TEXT NOT NULL, -- 'users', 'invoices', etc.
  total_count  INTEGER DEFAULT 0,
  synced_count INTEGER DEFAULT 0,
  mismatch_count INTEGER DEFAULT 0,
  mismatch_ids JSONB DEFAULT '[]',
  last_validated TIMESTAMPTZ DEFAULT NOW()
);

-- Done! Enable Realtime for these tables in:
-- Supabase Dashboard → Database → Replication → Add tables:
-- system_configs, audit_logs, email_logs, sync_audit, migration_stats
ALTER TABLE migration_stats REPLICA IDENTITY FULL;
