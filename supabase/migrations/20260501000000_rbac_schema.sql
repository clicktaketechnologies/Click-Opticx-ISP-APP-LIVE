-- Click Opticx ISP RBAC Schema Migration
-- Defines the centralized access control tables for dynamic navigation and permissions

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pages (
    id VARCHAR(100) PRIMARY KEY, -- Maps to navigation.ts (e.g., 'dashboard', 'users', 'ai-control')
    label VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) REFERENCES public.roles(name) ON DELETE CASCADE,
    page_id VARCHAR(100) REFERENCES public.pages(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_name, page_id)
);

-- Basic Seed Data for Essential Roles
INSERT INTO public.roles (name, description) VALUES
('Super Admin', 'Full system access'),
('Admin', 'Standard administrative access'),
('Support Admin', 'Customer support management'),
('Finance Admin', 'Billing and accounting management'),
('Network Admin', 'Infrastructure management')
ON CONFLICT (name) DO NOTHING;

-- Basic Seed Data for Pages (Matching navigation.ts)
INSERT INTO public.pages (id, label, module) VALUES
('dashboard', 'Overview', 'Dashboard'),
('monitor', 'System Health', 'Dashboard'),
('ai-control', 'AI Overview', 'AI'),
('ai-central', 'AI Rules', 'AI'),
('ai-calling', 'Voice Campaigns', 'AI'),
('ai-call-logs', 'Call Transcripts', 'AI'),
('comm-campaigns', 'Broadcast Campaigns', 'Communications'),
('comm-settings', 'Channel Setup', 'Communications'),
('comm-logs', 'Provider Logs', 'Communications'),
('olt-management', 'Infrastructure', 'Network'),
('admin-devices', 'OLT Devices', 'Network'),
('users', 'All Subscribers', 'Users'),
('approval-desk', 'Approval Desk', 'Users'),
('invoice-engine', 'Billing System', 'Finance'),
('invoice-management', 'Invoices', 'Finance'),
('accounting', 'Accounting', 'Finance'),
('system-config', 'System Gateway', 'System'),
('auth-control', 'Authentication', 'System')
ON CONFLICT (id) DO NOTHING;

-- Grant Super Admin access to all seeded pages
INSERT INTO public.role_permissions (role_name, page_id, can_view, can_edit, can_delete, can_export)
SELECT 'Super Admin', id, true, true, true, true FROM public.pages
ON CONFLICT (role_name, page_id) DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export;

-- Enable Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow authenticated read access on roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access on pages" ON public.pages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access on permissions" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');
