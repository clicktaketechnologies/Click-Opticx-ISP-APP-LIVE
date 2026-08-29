-- ============================================================
-- Click Opticx ISP — Phase 1: Foundation
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── PAYMENT GATEWAYS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_gateways (
  id                TEXT PRIMARY KEY, -- e.g., 'stripe', 'jazzcash'
  name              TEXT NOT NULL,
  enabled           BOOLEAN DEFAULT FALSE,
  priority          INTEGER DEFAULT 0,
  mode              TEXT DEFAULT 'sandbox', -- 'sandbox' or 'live'
  status            TEXT DEFAULT 'Disconnected', -- 'Connected', 'Disconnected', 'Error'
  last_check_at     TIMESTAMPTZ,
  config            JSONB NOT NULL DEFAULT '{}', -- stores API keys, etc.
  webhook_url       TEXT,
  signature_secret  TEXT,
  daily_limit       INTEGER DEFAULT 1000,
  usage_today       INTEGER DEFAULT 0,
  reputation_score  INTEGER DEFAULT 100,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EMAIL PROVIDERS (Expanded) ───────────────────────────
CREATE TABLE IF NOT EXISTS email_providers (
  id                TEXT PRIMARY KEY, -- e.g., 'gmail_smtp', 'resend'
  name              TEXT NOT NULL,
  enabled           BOOLEAN DEFAULT FALSE,
  priority          INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'Healthy',
  config            JSONB NOT NULL DEFAULT '{}',
  daily_limit       INTEGER DEFAULT 100,
  usage_today       INTEGER DEFAULT 0,
  from_address      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESPONSE MAPPINGS (Config-Driven Adapters) ───────────
CREATE TABLE IF NOT EXISTS response_mappings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id       TEXT NOT NULL, -- e.g., 'stripe', 'jazzcash'
  response_type     TEXT NOT NULL, -- e.g., 'payment_success', 'webhook'
  mappings          JSONB NOT NULL DEFAULT '{
    "fields": {},
    "status": {},
    "errors": {}
  }',
  version           INTEGER DEFAULT 1,
  changed_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED DATA ─────────────────────────────────────────────
INSERT INTO payment_gateways (id, name, enabled, priority, mode, status, config) VALUES
('stripe', 'Stripe', true, 1, 'sandbox', 'Connected', '{"apiKey": "sk_test_..."}'),
('jazzcash', 'JazzCash', true, 2, 'sandbox', 'Connected', '{"merchantId": "...", "password": "..."}'),
('easypaisa', 'EasyPaisa', false, 3, 'sandbox', 'Disconnected', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO email_providers (id, name, enabled, priority, status, config, daily_limit) VALUES
('gmail_smtp', 'Gmail SMTP', true, 1, 'Healthy', '{"host": "smtp.gmail.com", "port": 587}', 500),
('resend', 'Resend', true, 2, 'Healthy', '{"apiKey": "re_..."}', 3000)
ON CONFLICT (id) DO NOTHING;

-- ─── ENABLE REALTIME ────────────────────────────────────────
ALTER TABLE payment_gateways REPLICA IDENTITY FULL;
ALTER TABLE email_providers REPLICA IDENTITY FULL;
ALTER TABLE response_mappings REPLICA IDENTITY FULL;

-- Add to publication (if already exists, this might need manual step in dashboard)
-- But for schema tracking, we define it here.

-- ─── FUNCTIONS ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_provider_usage(p_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE email_providers
  SET usage_today = usage_today + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
