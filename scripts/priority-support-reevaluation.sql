-- ============================================
-- Priority Support Re-evaluation RPC
-- Phase 7.6: Re-evaluate ticket priority on plan change
-- ============================================

CREATE OR REPLACE FUNCTION reevaluate_ticket_priority(p_provider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_priority BOOLEAN;
BEGIN
  SELECT sp.has_priority_support INTO v_has_priority
  FROM provider_subscriptions ps
  JOIN subscription_plans sp ON sp.id = ps.plan_id
  WHERE ps.provider_id = p_provider_id AND ps.status = 'active';

  IF v_has_priority IS NULL THEN
    SELECT has_priority_support INTO v_has_priority
    FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  END IF;

  UPDATE support_tickets
  SET is_priority = v_has_priority, updated_at = now()
  WHERE provider_id = p_provider_id
    AND status IN ('open', 'replied')
    AND is_priority IS DISTINCT FROM v_has_priority;
END;
$$;
