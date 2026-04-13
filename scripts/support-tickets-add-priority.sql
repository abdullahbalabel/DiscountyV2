-- =============================================
-- Support Tickets: Add is_priority column
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Add is_priority column
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN NOT NULL DEFAULT false;

-- 2. Index for priority sorting
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority
  ON public.support_tickets(is_priority DESC, created_at DESC)
  WHERE is_priority = true;
