-- =============================================
-- Support Tickets schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id   UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  admin_reply   TEXT,
  replied_by    UUID REFERENCES auth.users(id),
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_provider ON public.support_tickets(provider_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- 3. Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Providers can create and read their own tickets
CREATE POLICY "Providers can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.provider_profiles WHERE id = provider_id
    )
  );

CREATE POLICY "Providers can read their own tickets"
  ON public.support_tickets FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.provider_profiles WHERE id = provider_id
    )
  );

-- Admins can read all tickets
CREATE POLICY "Admins can read all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );

-- Admins can update tickets (to reply)
CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  );
