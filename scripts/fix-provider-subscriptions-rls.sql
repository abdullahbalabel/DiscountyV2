-- Fix: Add public read policy on provider_subscriptions
-- so the customer feed can determine which providers have homepage_placement.
-- The query only selects provider_id and plan_id — no billing info is exposed.

-- Drop if re-running
DROP POLICY IF EXISTS "Public can read active subscriptions" ON provider_subscriptions;

CREATE POLICY "Public can read active subscriptions" ON provider_subscriptions
  FOR SELECT USING (status = 'active');
