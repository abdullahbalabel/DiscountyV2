-- ============================================
-- Fix: Report Notifications Not Working
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix notifications CHECK constraint — add report status types
-- The admin reports page inserts types: report_reviewed, report_resolved, report_dismissed
-- but the constraint only had 'rejection_report', causing silent INSERT failures.

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

-- 2. Update submit_rejection_report RPC to notify admins when a new report is submitted
-- Admins need to know about pending reports so they can act on them.

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
