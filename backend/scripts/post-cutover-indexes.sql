-- ============================================================
-- Click Opticx ISP — Post-Cutover Index Optimization
-- Run AFTER Phase 3 cutover when Supabase is primary
-- ============================================================

-- ─── USERS ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_area ON users(area);
CREATE INDEX IF NOT EXISTS idx_users_package_id ON users(package_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_connection_id ON users(connection_id);

-- ─── INVOICES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);

-- ─── PAYMENTS ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ─── KYC ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user ON kyc_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_kyc_files_user ON kyc_files(user_id);

-- ─── SUPPORT TICKETS ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);

-- ─── EMAIL LOGS ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider_used);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- ─── AUDIT LOGS ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── MIGRATION STATS ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_migration_stats_batch ON migration_stats(batch_id);
CREATE INDEX IF NOT EXISTS idx_migration_stats_validated ON migration_stats(last_validated DESC);

-- ─── NETWORK ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nas_configs_name ON nas_configs(name) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_noc_alerts_severity ON noc_alerts(severity) WHERE severity IS NOT NULL;

-- ─── SYSTEM CONFIGS ─────────────────────────────────────────
-- Already has unique index on 'key', no additional needed

-- ============================================================
-- ANALYZE all tables to update planner statistics
-- ============================================================
ANALYZE users;
ANALYZE invoices;
ANALYZE payments;
ANALYZE kyc_requests;
ANALYZE kyc_files;
ANALYZE support_tickets;
ANALYZE email_logs;
ANALYZE audit_logs;
ANALYZE migration_stats;
