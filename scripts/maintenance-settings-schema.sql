-- Maintenance Window Controls — Database Schema
-- Run this in the Supabase SQL Editor.
-- Creates maintenance_settings + audit_log tables, RLS, trigger, seed row.

-- ============================================================
-- 0. Trigger function — create if not already deployed
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. maintenance_settings — single-row global maintenance state
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id                UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  is_enabled        BOOLEAN NOT NULL DEFAULT false,
  message_title     TEXT NOT NULL DEFAULT 'Scheduled Maintenance',
  message_body      TEXT NOT NULL DEFAULT 'We are currently performing scheduled maintenance to improve your experience. We''ll be back shortly. Thank you for your patience.',
  estimated_duration TEXT,
  scheduled_start   TIMESTAMPTZ,
  scheduled_end     TIMESTAMPTZ,
  enabled_by        UUID REFERENCES auth.users(id),
  enabled_at        TIMESTAMPTZ,
  disabled_by       UUID REFERENCES auth.users(id),
  disabled_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Single-row enforcement
  CONSTRAINT maintenance_settings_single_row CHECK (id = '00000000-0000-0000-0000-000000000001'),

  -- scheduled_end must be after scheduled_start when both are set
  CONSTRAINT maintenance_settings_schedule_order CHECK (
    scheduled_end IS NULL OR scheduled_start IS NULL OR scheduled_end > scheduled_start
  )
);

-- ============================================================
-- 2. audit_log — generic extensible audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     TEXT,
  performed_by    UUID REFERENCES auth.users(id),
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  details         JSONB
);

-- ============================================================
-- 3. RLS — maintenance_settings
-- ============================================================
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- anon can SELECT (read-only status check, HC-02)
CREATE POLICY "maintenance_settings_anon_select"
  ON public.maintenance_settings FOR SELECT
  TO anon
  USING (true);

-- authenticated can SELECT
CREATE POLICY "maintenance_settings_authenticated_select"
  ON public.maintenance_settings FOR SELECT
  TO authenticated
  USING (true);

-- super_admin can UPDATE (HC-01)
CREATE POLICY "maintenance_settings_super_admin_update"
  ON public.maintenance_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND ar.name = 'super_admin'
        AND ap.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND ar.name = 'super_admin'
        AND ap.is_active = true
    )
  );

-- ============================================================
-- 4. RLS — audit_log
-- ============================================================
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- authenticated can INSERT (via RPC)
CREATE POLICY "audit_log_authenticated_insert"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- super_admin can SELECT
CREATE POLICY "audit_log_super_admin_select"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.user_id = auth.uid()
        AND ar.name = 'super_admin'
        AND ap.is_active = true
    )
  );

-- ============================================================
-- 5. updated_at trigger — reuses existing public.set_updated_at()
-- ============================================================
DROP TRIGGER IF EXISTS trg_maintenance_settings_updated_at ON public.maintenance_settings;
CREATE TRIGGER trg_maintenance_settings_updated_at
  BEFORE UPDATE ON public.maintenance_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. Seed single maintenance_settings row
-- ============================================================
INSERT INTO public.maintenance_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
