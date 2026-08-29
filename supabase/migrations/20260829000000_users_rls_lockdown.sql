-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL SECURITY MIGRATION — run in the Supabase SQL Editor.
--
-- WHY: the Supabase ANON key (public, shipped in the browser bundle) currently
-- has unrestricted access to the `users` table. The frontend even exercises
-- this path (db.ts → `supabase.from('users').select('*')`), which downloads
-- EVERY subscriber row — including password hashes and raw_data (sessions,
-- verification codes) — to any visitor's browser.
--
-- EFFECT after running: anonymous reads of `users`/`staff` are blocked.
-- ⚠️  The frontend's anonymous `select('*')` user sync will STOP returning
--     rows (by design — it is the vulnerability). Admin user listings must go
--     through the authenticated backend API (GET /api/users with a Bearer
--     token), which the patched frontend now supports.
-- Service-role access (the backend) is unaffected — service_role bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Lock down the users table ────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow each authenticated user to read/update their own row
DROP POLICY IF EXISTS "users_self_select" ON public.users;
CREATE POLICY "users_self_select"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No INSERT/DELETE policies for anon/authenticated: those flows must use the
-- service-role backend (signup endpoint), which bypasses RLS.

-- 2. Lock down the staff table ────────────────────────────────────────────────
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_self_select" ON public.staff;
CREATE POLICY "staff_self_select"
  ON public.staff FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = email);

-- 3. Explicitly deny the anon role any direct access (defense in depth) ──────
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.staff FROM anon;

-- 4. Sanity report (run after applying) ──────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'staff');
