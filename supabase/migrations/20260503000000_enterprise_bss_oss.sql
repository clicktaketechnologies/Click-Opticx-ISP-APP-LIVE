-- Enterprise BSS/OSS Schema Migration
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Organizations (Multi-tenant Hierarchy)
CREATE TABLE IF NOT EXISTS public.orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_org_id UUID REFERENCES public.orgs(id),
    type VARCHAR(50) DEFAULT 'ISP', -- ISP, RESELLER, DEALER
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- 2. Device Templates (Vendor-agnostic parsing rules)
CREATE TABLE IF NOT EXISTS public.device_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    protocol VARCHAR(50) NOT NULL, -- SNMP, SSH, API
    commands JSONB NOT NULL, -- Defines OIDs, SSH commands, API paths
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ONTs / CPEs
CREATE TABLE IF NOT EXISTS public.onts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    subscriber_id UUID, -- References users(id)
    olt_id UUID, -- References devices(id)
    pon_port VARCHAR(50),
    status VARCHAR(50) DEFAULT 'OFFLINE',
    optical_rx NUMERIC,
    optical_tx NUMERIC,
    last_polled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Double-Entry Ledger
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL, -- Subscriber or Reseller ID
    type VARCHAR(20) NOT NULL, -- CREDIT, DEBIT
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- INVOICE, PAYMENT, ADJUSTMENT
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PAID, OVERDUE, VOID
    due_date TIMESTAMPTZ NOT NULL,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dunning Rules (Automated debt collection)
CREATE TABLE IF NOT EXISTS public.dunning_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    days_overdue INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- EMAIL, SMS, WHATSAPP, THROTTLE, SUSPEND
    template_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs (Compliance & Traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Email & Comms Preferences
CREATE TABLE IF NOT EXISTS public.email_preferences (
    subscriber_id UUID PRIMARY KEY,
    marketing BOOLEAN DEFAULT TRUE,
    billing BOOLEAN DEFAULT TRUE,
    outages BOOLEAN DEFAULT TRUE,
    bounce_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS Policies (Examples)
CREATE POLICY "Orgs are viewable by assigned users" 
ON public.orgs FOR SELECT USING (true); -- Implement proper auth.uid() checks

CREATE POLICY "Ledger entries are read-only for frontend"
ON public.ledger_entries FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy for frontend, must be done via Service Role Key in Backend

COMMIT;
