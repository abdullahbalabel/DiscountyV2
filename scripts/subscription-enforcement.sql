-- ============================================
-- Subscription Enforcement
-- Phase 5: Feature Enforcement
-- ============================================

-- ── 5.1 — Deal Creation Limit Trigger ──────────

CREATE OR REPLACE FUNCTION enforce_deal_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  SELECT sp.max_active_deals INTO v_max
  FROM provider_subscriptions ps
  JOIN subscription_plans sp ON sp.id = ps.plan_id
  WHERE ps.provider_id = NEW.provider_id AND ps.status = 'active';

  -- Fallback to Free plan if no subscription
  IF v_max IS NULL THEN
    SELECT max_active_deals INTO v_max
    FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  END IF;

  -- Only count non-deleted, non-expired deals (exclude current row on UPDATE)
  SELECT COUNT(*) INTO v_count
  FROM discounts
  WHERE provider_id = NEW.provider_id
    AND status NOT IN ('deleted', 'expired')
    AND end_time > now()
    AND id != NEW.id;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Deal limit reached (% of %)', v_count, v_max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_deal_limit ON discounts;
CREATE TRIGGER trg_enforce_deal_limit
  BEFORE INSERT ON discounts
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION enforce_deal_limit();

-- ── 5.4 — Push Notification Counter Table ──────

CREATE TABLE IF NOT EXISTS provider_push_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, month_start)
);

ALTER TABLE provider_push_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can read own push counters" ON provider_push_counters
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role manages push counters" ON provider_push_counters
  FOR ALL USING (auth.role() = 'service_role');

-- ── RPC: check_provider_push_limit ─────────────

CREATE OR REPLACE FUNCTION check_provider_push_limit(p_provider_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_max INTEGER;
  v_sent INTEGER;
  v_month_start DATE;
BEGIN
  v_month_start := date_trunc('month', CURRENT_DATE)::DATE;

  SELECT sp.max_push_notifications INTO v_plan_max
  FROM provider_subscriptions ps
  JOIN subscription_plans sp ON sp.id = ps.plan_id
  WHERE ps.provider_id = p_provider_id AND ps.status = 'active';

  IF v_plan_max IS NULL THEN
    SELECT max_push_notifications INTO v_plan_max
    FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  END IF;

  SELECT COALESCE(sent_count, 0) INTO v_sent
  FROM provider_push_counters
  WHERE provider_id = p_provider_id AND month_start = v_month_start;

  RETURN json_build_object(
    'allowed', COALESCE(v_sent, 0) < v_plan_max,
    'sent_count', COALESCE(v_sent, 0),
    'max_allowed', v_plan_max,
    'month_start', v_month_start
  );
END;
$$;

-- ── RPC: increment_provider_push_count ─────────

CREATE OR REPLACE FUNCTION increment_provider_push_count(p_provider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE;
BEGIN
  v_month_start := date_trunc('month', CURRENT_DATE)::DATE;

  INSERT INTO provider_push_counters (provider_id, month_start, sent_count, updated_at)
  VALUES (p_provider_id, v_month_start, 1, now())
  ON CONFLICT (provider_id, month_start)
  DO UPDATE SET
    sent_count = provider_push_counters.sent_count + 1,
    updated_at = now();
END;
$$;

-- ── 5.6 — Enhanced process_subscription_downgrades ──
-- Updates the existing RPC to also send a notification when deals are paused

CREATE OR REPLACE FUNCTION process_subscription_downgrades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_new_plan subscription_plans%ROWTYPE;
  v_processed INTEGER := 0;
  v_deal RECORD;
  v_kept INTEGER;
  v_paused_count INTEGER;
  v_free_plan_id UUID;
BEGIN
  FOR v_sub IN
    SELECT ps.*
    FROM provider_subscriptions ps
    WHERE ps.current_period_end < now()
      AND ps.pending_plan_id IS NOT NULL
      AND ps.status = 'active'
  LOOP
    -- Get new plan
    SELECT * INTO v_new_plan FROM subscription_plans WHERE id = v_sub.pending_plan_id;

    IF v_new_plan IS NULL THEN
      CONTINUE;
    END IF;

    -- Swap plan
    UPDATE provider_subscriptions
    SET
      plan_id = v_sub.pending_plan_id,
      billing_cycle = COALESCE(v_sub.pending_cycle, billing_cycle),
      amount_sar = CASE
        WHEN COALESCE(v_sub.pending_cycle, v_sub.billing_cycle) = 'monthly'
          THEN COALESCE(v_new_plan.monthly_price_sar, 0)
        ELSE COALESCE(v_new_plan.yearly_price_sar, 0)
      END,
      pending_plan_id = NULL,
      pending_cycle = NULL,
      updated_at = now()
    WHERE id = v_sub.id;

    -- Pause excess deals beyond new plan limit
    v_kept := 0;
    v_paused_count := 0;
    FOR v_deal IN
      SELECT id FROM discounts
      WHERE provider_id = v_sub.provider_id
        AND status = 'active'
        AND end_time > now()
      ORDER BY created_at DESC
    LOOP
      v_kept := v_kept + 1;
      IF v_kept > v_new_plan.max_active_deals THEN
        UPDATE discounts
        SET status = 'paused',
            updated_at = now()
        WHERE id = v_deal.id;
        v_paused_count := v_paused_count + 1;
      END IF;
    END LOOP;

    -- Notify provider about paused deals
    IF v_paused_count > 0 THEN
      INSERT INTO notifications (user_id, type, title, body)
      SELECT
        pp.user_id,
        'account_activity',
        v_paused_count || ' deals paused due to plan change',
        v_paused_count || ' of your deals were paused because your plan changed to ' || v_new_plan.name || '. You can reactivate them within your new limit.'
      FROM provider_profiles pp
      WHERE pp.id = v_sub.provider_id;
    END IF;

    -- Un-feature deals if new plan does not include homepage placement
    IF v_new_plan.max_featured_deals = 0 OR NOT v_new_plan.has_homepage_placement THEN
      UPDATE discounts SET is_featured = false, featured_until = NULL, updated_at = now()
      WHERE provider_id = v_sub.provider_id AND is_featured = true;
    END IF;

    -- Re-evaluate ticket priority for new plan
    PERFORM reevaluate_ticket_priority(v_sub.provider_id);

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$;
