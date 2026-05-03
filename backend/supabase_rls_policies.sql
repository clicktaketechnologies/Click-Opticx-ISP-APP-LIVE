-- ============================================================
-- Click Opticx ISP — Phase 2: Supabase RLS Policies
-- Execute this script in the Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts if re-running
DROP POLICY IF EXISTS "service_full_access" ON users;
DROP POLICY IF EXISTS "customers_read_own" ON users;
DROP POLICY IF EXISTS "hide_deleted_users" ON users;
DROP POLICY IF EXISTS "invoices_service_write" ON invoices;
DROP POLICY IF EXISTS "invoices_customer_read" ON invoices;

-- 3. Users Table Policies
-- Service role (Node.js backend) has full access
CREATE POLICY "service_full_access" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Soft-delete filter: Never show soft-deleted users to anon/authenticated unless it's the backend
CREATE POLICY "hide_deleted_users" ON users
    FOR SELECT USING (
        deleted = false OR auth.role() = 'service_role'
    );

-- Customers can only read their own user data, OR staff can read if they have roles
CREATE POLICY "customers_read_own" ON users
    FOR SELECT USING (
        -- User reading their own profile
        auth.uid()::text = id
        OR 
        -- RBAC check: user is an admin
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid()::text 
            AND role IN ('SuperAdmin', 'Admin', 'SupportAdmin', 'Manager')
        )
    );

-- 4. Invoices Table Policies
-- Only backend (service_role) can INSERT/UPDATE/DELETE invoices
CREATE POLICY "invoices_service_write" ON invoices
    FOR ALL USING (auth.role() = 'service_role');

-- Customers can only read their own invoices, admins can read all
CREATE POLICY "invoices_customer_read" ON invoices
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()::text
            AND role IN ('SuperAdmin', 'Admin', 'FinanceAdmin', 'Accountant')
        )
    );

-- 5. Payments Table Policies
CREATE POLICY "payments_service_write" ON payments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "payments_customer_read" ON payments
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()::text
            AND role IN ('SuperAdmin', 'Admin', 'FinanceAdmin', 'Accountant')
        )
    );

-- 6. Signup Requests Policies
CREATE POLICY "signup_service_write" ON signup_requests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "signup_admin_read" ON signup_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()::text
            AND role IN ('SuperAdmin', 'Admin', 'SupportAdmin')
        )
    );

-- 7. Support Tickets Policies
CREATE POLICY "tickets_service_write" ON support_tickets
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "tickets_customer_read" ON support_tickets
    FOR SELECT USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()::text
            AND role IN ('SuperAdmin', 'Admin', 'SupportAdmin')
        )
    );
