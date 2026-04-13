-- ============================================
-- Fix Deal RLS Visibility + Saved Deals Table
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add paused_by_plan_change column to discounts if it doesn't exist
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS is_paused_by_plan_change BOOLEAN NOT NULL DEFAULT false;

-- 2. Create saved_deals join table
CREATE TABLE IF NOT EXISTS public.saved_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_deals_user_id ON public.saved_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_deals_deal_id ON public.saved_deals(deal_id);

-- 3. Enable RLS on saved_deals
ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

-- 4. saved_deals RLS policies
CREATE POLICY "Users can view own saved deals"
  ON public.saved_deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save deals"
  ON public.saved_deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave deals"
  ON public.saved_deals FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Admins can view all saved deals
CREATE POLICY "Admins can view all saved deals"
  ON public.saved_deals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 6. Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON public.saved_deals TO authenticated;

-- 7. Create provider_deals view for provider's own deals with joined data
CREATE OR REPLACE VIEW public.provider_deals AS
SELECT
  d.id,
  d.provider_id,
  d.title,
  d.description,
  d.discount_value,
  d.type,
  d.start_time,
  d.end_time,
  d.status,
  d.created_at,
  d.updated_at,
  d.view_count,
  d.alphanumeric_code,
  d.category_id,
  d.image_url,
  d.max_redemptions,
  d.current_redemptions,
  d.conditions,
  d.is_featured,
  d.featured_until,
  d.is_paused_by_plan_change,
  c.name AS category_name,
  c.name_ar AS category_name_ar,
  c.icon AS category_icon
FROM public.discounts d
LEFT JOIN public.categories c ON c.id = d.category_id
WHERE d.provider_id IN (
  SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
);

-- 8. Grants for provider_deals view
GRANT SELECT ON public.provider_deals TO authenticated;
