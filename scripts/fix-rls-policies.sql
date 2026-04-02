-- Fix redemptions RLS policies
-- customer_id references customer_profiles.id, not auth.uid()

-- Drop old policies
DROP POLICY IF EXISTS "Customers can view own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Customers can claim redemptions" ON redemptions;
DROP POLICY IF EXISTS redemptions_select_customer ON redemptions;

-- View own redemptions: customer_id matches the logged-in user's profile
CREATE POLICY "Customers can view own redemptions" ON redemptions
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  );

-- Claim (insert) redemptions: customer_id matches the logged-in user's profile
CREATE POLICY "Customers can claim redemptions" ON redemptions
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  );
