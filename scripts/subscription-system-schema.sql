-- ============================================
-- Subscription System Schema
-- Phase 1: Backend Foundation
-- ============================================

-- ── subscription_plans ─────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  name_ar                   TEXT NOT NULL,
  description               TEXT,
  description_ar            TEXT,

  -- Feature flags
  max_active_deals          INTEGER NOT NULL DEFAULT 1,
  max_featured_deals        INTEGER NOT NULL DEFAULT 0,
  has_analytics             BOOLEAN NOT NULL DEFAULT false,
  max_push_notifications    INTEGER NOT NULL DEFAULT 0,
  has_priority_support      BOOLEAN NOT NULL DEFAULT false,
  profile_badge             TEXT,
  profile_badge_ar          TEXT,
  has_homepage_placement    BOOLEAN NOT NULL DEFAULT false,

  -- Pricing (nullable = cycle unavailable)
  monthly_price_sar         NUMERIC,
  yearly_price_sar          NUMERIC,

  -- Stripe mapping
  stripe_product_id         TEXT,
  stripe_monthly_price_id   TEXT,
  stripe_yearly_price_id    TEXT,

  -- Config
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  sort_order                INTEGER NOT NULL DEFAULT 0,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are publicly readable" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ── provider_subscriptions ─────────────────────

CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id               UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  plan_id                   UUID NOT NULL REFERENCES subscription_plans(id),

  -- Billing
  billing_cycle             TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_sar                NUMERIC NOT NULL,

  -- Stripe
  stripe_subscription_id    TEXT UNIQUE,
  stripe_customer_id        TEXT,

  -- Lifecycle
  status                    TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  starts_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end        TIMESTAMPTZ NOT NULL,
  cancelled_at              TIMESTAMPTZ,

  -- Downgrade tracking
  pending_plan_id           UUID REFERENCES subscription_plans(id),
  pending_cycle             TEXT CHECK (pending_cycle IN ('monthly', 'yearly')),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active subscription per provider
  CONSTRAINT one_active_per_provider
    EXCLUDE USING btree (provider_id WITH =)
    WHERE (status = 'active')
);

ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can read own subscription" ON provider_subscriptions
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can read all subscriptions" ON provider_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public can read active subscriptions" ON provider_subscriptions
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service role manages subscriptions" ON provider_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ── Discounts: add featured columns ────────────

ALTER TABLE discounts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- ── Seed: Default Free Plan ────────────────────

INSERT INTO subscription_plans (name, name_ar, description, description_ar,
  max_active_deals, max_featured_deals, has_analytics,
  max_push_notifications, has_priority_support, profile_badge, profile_badge_ar,
  has_homepage_placement, monthly_price_sar, yearly_price_sar, is_active, sort_order
) VALUES (
  'Free', 'مجاني',
  'Get started with basic deal listings', 'ابدأ بإنشاء العروض الأساسية',
  1, 0, false, 0, false, NULL, NULL, false,
  0, 0, true, 0
) ON CONFLICT DO NOTHING;

-- ── Seed: Assign Free plan to existing approved providers ──

INSERT INTO provider_subscriptions (provider_id, plan_id, billing_cycle, amount_sar, status, starts_at, current_period_end)
SELECT pp.id, sp.id, 'monthly', 0, 'active', now(), now() + interval '100 years'
FROM provider_profiles pp, subscription_plans sp
WHERE sp.name = 'Free' AND pp.approval_status = 'approved'
ON CONFLICT DO NOTHING;

-- ── RPC: check_provider_deal_limit ─────────────

CREATE OR REPLACE FUNCTION check_provider_deal_limit(p_provider_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_current_count INTEGER;
  v_sub_id UUID;
BEGIN
  -- Lock provider row to prevent race conditions
  PERFORM id FROM provider_profiles WHERE id = p_provider_id FOR UPDATE;

  -- Get active subscription
  SELECT plan_id INTO v_sub_id
  FROM provider_subscriptions
  WHERE provider_id = p_provider_id AND status = 'active'
  LIMIT 1;

  -- If no subscription, use Free plan defaults
  IF v_sub_id IS NULL THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  ELSE
    SELECT sp.* INTO v_plan
    FROM subscription_plans sp
    INNER JOIN provider_subscriptions ps ON ps.plan_id = sp.id
    WHERE ps.provider_id = p_provider_id AND ps.status = 'active'
    LIMIT 1;
  END IF;

  -- Count active (non-deleted, non-expired) deals
  SELECT COUNT(*) INTO v_current_count
  FROM discounts
  WHERE provider_id = p_provider_id
    AND status != 'deleted'
    AND end_time > now();

  RETURN json_build_object(
    'allowed', v_current_count < v_plan.max_active_deals,
    'current_count', v_current_count,
    'max_allowed', v_plan.max_active_deals,
    'plan_name', v_plan.name,
    'plan_name_ar', v_plan.name_ar
  );
END;
$$;

-- ── RPC: get_provider_plan_features ────────────

CREATE OR REPLACE FUNCTION get_provider_plan_features(p_provider_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
BEGIN
  SELECT sp.* INTO v_plan
  FROM subscription_plans sp
  INNER JOIN provider_subscriptions ps ON ps.plan_id = sp.id
  WHERE ps.provider_id = p_provider_id AND ps.status = 'active'
  LIMIT 1;

  -- Fallback to Free plan
  IF v_plan IS NULL THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE name = 'Free' LIMIT 1;
  END IF;

  IF v_plan IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'max_active_deals', v_plan.max_active_deals,
    'max_featured_deals', v_plan.max_featured_deals,
    'has_analytics', v_plan.has_analytics,
    'max_push_notifications', v_plan.max_push_notifications,
    'has_priority_support', v_plan.has_priority_support,
    'profile_badge', v_plan.profile_badge,
    'profile_badge_ar', v_plan.profile_badge_ar,
    'has_homepage_placement', v_plan.has_homepage_placement
  );
END;
$$;

-- ── RPC: process_subscription_downgrades ───────

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
    FOR v_deal IN
      SELECT id FROM discounts
      WHERE provider_id = v_sub.provider_id
        AND status = 'active'
        AND end_time > now()
      ORDER BY created_at DESC
    LOOP
      v_kept := v_kept + 1;
      IF v_kept > v_new_plan.max_active_deals THEN
        UPDATE discounts SET status = 'paused', updated_at = now()
        WHERE id = v_deal.id;
      END IF;
    END LOOP;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$;

-- ── Trigger: assign_free_plan_on_signup ─────────

CREATE OR REPLACE FUNCTION assign_free_plan_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  IF NEW.approval_status = 'approved' THEN
    SELECT id INTO v_free_plan_id FROM subscription_plans WHERE name = 'Free' LIMIT 1;

    IF v_free_plan_id IS NOT NULL THEN
      INSERT INTO provider_subscriptions (provider_id, plan_id, billing_cycle, amount_sar, status, starts_at, current_period_end)
      VALUES (NEW.id, v_free_plan_id, 'monthly', 0, 'active', now(), now() + interval '100 years')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_free_plan_on_signup ON provider_profiles;
CREATE TRIGGER trg_assign_free_plan_on_signup
  AFTER INSERT ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_free_plan_on_signup();

-- ── Trigger: handle_provider_approval ──────────

CREATE OR REPLACE FUNCTION handle_provider_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
  v_existing_sub_id UUID;
BEGIN
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    -- Check if subscription already exists
    SELECT id INTO v_existing_sub_id
    FROM provider_subscriptions
    WHERE provider_id = NEW.id AND status = 'active'
    LIMIT 1;

    IF v_existing_sub_id IS NULL THEN
      SELECT id INTO v_free_plan_id FROM subscription_plans WHERE name = 'Free' LIMIT 1;

      IF v_free_plan_id IS NOT NULL THEN
        INSERT INTO provider_subscriptions (provider_id, plan_id, billing_cycle, amount_sar, status, starts_at, current_period_end)
        VALUES (NEW.id, v_free_plan_id, 'monthly', 0, 'active', now(), now() + interval '100 years')
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_provider_approval ON provider_profiles;
CREATE TRIGGER trg_handle_provider_approval
  AFTER UPDATE ON provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_provider_approval();
