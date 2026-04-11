-- ============================================
-- Discounty v1.2.1 Database Migrations
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- Task 1.1 — PostGIS Extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Task 1.1 — deal_conditions table
-- ============================================

CREATE TABLE IF NOT EXISTS deal_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('time','quantity','scope','payment','other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deal_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active conditions"
  ON deal_conditions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage conditions"
  ON deal_conditions FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

-- ============================================
-- Task 1.2 — rejection_reports table
-- ============================================

CREATE TABLE IF NOT EXISTS rejection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customer_profiles(user_id) ON DELETE CASCADE,
  redemption_id UUID NOT NULL REFERENCES redemptions(id) ON DELETE CASCADE,
  reason_type TEXT NOT NULL CHECK (reason_type IN ('cashier_unaware','deal_expired','terms_changed','technical_issue','other')),
  reason_detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed','auto_hidden')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(deal_id, customer_id)
);

ALTER TABLE rejection_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert own rejection reports"
  ON rejection_reports FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view own rejection reports"
  ON rejection_reports FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all rejection reports"
  ON rejection_reports FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

CREATE POLICY "Admins can update rejection reports"
  ON rejection_reports FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

-- ============================================
-- Task 1.3 — data_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export','delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  data_payload JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  admin_notes TEXT,
  expires_at TIMESTAMPTZ
);

ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own data requests"
  ON data_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own data requests"
  ON data_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all data requests"
  ON data_requests FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

CREATE POLICY "Admins can update data requests"
  ON data_requests FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

-- ============================================
-- Task 1.4 — activity_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

-- ============================================
-- Task 1.5 — Alter existing tables
-- ============================================

-- Add conditions array to discounts
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS conditions UUID[] DEFAULT '{}';

-- Add privacy columns to customer_profiles
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS marketing_emails_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS data_sharing_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add generated geography column to provider_profiles
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)) STORED;

-- Create GIST index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_provider_location ON provider_profiles USING GIST(location);

-- Update notifications CHECK constraint with new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'deal_redeemed',
    'new_deal',
    'account_activity',
    'deal_expiring',
    'review_received',
    'admin_broadcast',
    'admin_message',
    'geofence_reminder',
    'rejection_report',
    'deal_hidden',
    'data_request_completed',
    'report_reviewed',
    'report_resolved',
    'report_dismissed'
  )
);

-- ============================================
-- Task 1.6 — RPC Functions
-- ============================================

-- submit_rejection_report
CREATE OR REPLACE FUNCTION submit_rejection_report(
  p_deal_id UUID,
  p_redemption_id UUID,
  p_reason_type TEXT,
  p_reason_detail TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_report_id UUID;
  v_pending_count INTEGER;
  v_auto_hidden BOOLEAN := false;
  v_deal_title TEXT;
BEGIN
  -- Validate auth
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate that the caller owns the redemption
  IF NOT EXISTS (
    SELECT 1 FROM redemptions
    WHERE id = p_redemption_id AND discount_id = p_deal_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redemption not found');
  END IF;

  -- Insert rejection report (UNIQUE constraint prevents duplicates)
  INSERT INTO rejection_reports (deal_id, customer_id, redemption_id, reason_type, reason_detail)
  VALUES (p_deal_id, v_customer_id, p_redemption_id, p_reason_type, p_reason_detail)
  RETURNING id INTO v_report_id;

  -- Log activity
  INSERT INTO activity_logs (actor_id, action_type, entity_type, entity_id, details)
  VALUES (v_customer_id, 'submit_rejection_report', 'rejection_report', v_report_id,
    jsonb_build_object('deal_id', p_deal_id, 'reason_type', p_reason_type));

  -- Count pending reports for this deal
  SELECT COUNT(*) INTO v_pending_count
  FROM rejection_reports
  WHERE deal_id = p_deal_id AND status = 'pending';

  -- Auto-hide deal if 3+ pending reports
  IF v_pending_count >= 3 THEN
    UPDATE discounts SET status = 'hidden', updated_at = now()
    WHERE id = p_deal_id;

    UPDATE rejection_reports SET status = 'auto_hidden'
    WHERE deal_id = p_deal_id AND status = 'pending';

    -- Notify the provider
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT provider_profiles.user_id, 'deal_hidden', 'Deal Hidden',
      'Your deal has been automatically hidden due to multiple rejection reports.',
      jsonb_build_object('deal_id', p_deal_id)
    FROM provider_profiles
    WHERE provider_profiles.id = (SELECT provider_id FROM discounts WHERE id = p_deal_id);

    -- Log auto-hide
    INSERT INTO activity_logs (actor_id, action_type, entity_type, entity_id, details)
    VALUES (v_customer_id, 'auto_hide_deal', 'discount', p_deal_id,
      jsonb_build_object('report_count', v_pending_count));

    v_auto_hidden := true;
  END IF;

  -- Notify all admins about the new report
  SELECT title INTO v_deal_title FROM discounts WHERE id = p_deal_id;

  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    admin_profiles.user_id,
    'rejection_report',
    'New Rejection Report',
    'A customer reported an issue with "' || COALESCE(v_deal_title, 'a deal') || '".',
    jsonb_build_object('report_id', v_report_id, 'deal_id', p_deal_id, 'reason_type', p_reason_type)
  FROM admin_profiles
  WHERE admin_profiles.is_active = true;

  RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'auto_hidden', v_auto_hidden);
END;
$$;

-- request_data_export
CREATE OR REPLACE FUNCTION request_data_export()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check no pending export request exists
  IF EXISTS (
    SELECT 1 FROM data_requests
    WHERE user_id = v_user_id AND request_type = 'export' AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending export request already exists';
  END IF;

  INSERT INTO data_requests (user_id, request_type)
  VALUES (v_user_id, 'export')
  RETURNING id INTO v_request_id;

  INSERT INTO activity_logs (actor_id, action_type, entity_type, entity_id)
  VALUES (v_user_id, 'request_data_export', 'data_request', v_request_id);

  RETURN v_request_id;
END;
$$;

-- request_account_deletion
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check no pending delete request exists
  IF EXISTS (
    SELECT 1 FROM data_requests
    WHERE user_id = v_user_id AND request_type = 'delete' AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending deletion request already exists';
  END IF;

  INSERT INTO data_requests (user_id, request_type)
  VALUES (v_user_id, 'delete')
  RETURNING id INTO v_request_id;

  INSERT INTO activity_logs (actor_id, action_type, entity_type, entity_id)
  VALUES (v_user_id, 'request_account_deletion', 'data_request', v_request_id);

  RETURN v_request_id;
END;
$$;

-- update_privacy_settings
CREATE OR REPLACE FUNCTION update_privacy_settings(
  p_location_tracking BOOLEAN DEFAULT NULL,
  p_marketing_emails BOOLEAN DEFAULT NULL,
  p_data_sharing BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_details JSONB := '{}';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Build details object for changed fields only
  IF p_location_tracking IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('location_tracking_enabled', p_location_tracking);
  END IF;
  IF p_marketing_emails IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('marketing_emails_enabled', p_marketing_emails);
  END IF;
  IF p_data_sharing IS NOT NULL THEN
    v_details := v_details || jsonb_build_object('data_sharing_enabled', p_data_sharing);
  END IF;

  UPDATE customer_profiles
  SET
    location_tracking_enabled = COALESCE(p_location_tracking, location_tracking_enabled),
    marketing_emails_enabled = COALESCE(p_marketing_emails, marketing_emails_enabled),
    data_sharing_enabled = COALESCE(p_data_sharing, data_sharing_enabled),
    updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO activity_logs (actor_id, action_type, entity_type, entity_id, details)
  VALUES (v_user_id, 'update_privacy_settings', 'customer_profile', v_user_id, v_details);
END;
$$;

-- ============================================
-- Task 1.7 — Seed Deal Conditions
-- ============================================

INSERT INTO deal_conditions (name, name_ar, icon, category, sort_order) VALUES
  ('Excludes Weekends',       'لا يشمل عطلة نهاية الأسبوع',  'event-busy',      'time',     1),
  ('Excludes Holidays',       'لا يشمل العطل الرسمية',       'celebration',     'time',     2),
  ('Valid Dine-In Only',      'صالح للأكل في المكان فقط',    'restaurant',      'scope',    3),
  ('Valid Takeaway Only',     'صالح للطلبات الخارجية فقط',   'takeout-dining',  'scope',    4),
  ('Valid Delivery Only',     'صالح للتوصيل فقط',            'delivery-dining', 'scope',    5),
  ('Entire Menu Included',    'يشمل القائمة كاملة',          'restaurant-menu', 'scope',    6),
  ('Selected Items Only',     'أصناف محددة فقط',             'playlist-remove', 'scope',    7),
  ('Max 2 Persons',           'شخصان كحد أقصى',              'groups',          'quantity', 8),
  ('Max 4 Persons',           '4 أشخاص كحد أقصى',            'groups',          'quantity', 9),
  ('No Minimum Order',        'لا يوجد حد أدنى للطلب',       'remove-shopping-cart', 'payment', 10),
  ('Cash Only',               'نقداً فقط',                   'payments',        'payment', 11),
  ('New Customers Only',      'للعملاء الجدد فقط',           'person-add',      'other',    12),
  ('Cannot Combine Offers',   'لا يمكن دمجه مع عروض أخرى',   'link-off',        'other',    13),
  ('Appointment Required',    'يتطلب حجز مسبق',              'calendar-today',  'other',    14)
ON CONFLICT DO NOTHING;
