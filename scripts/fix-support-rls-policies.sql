-- ============================================
-- Fix Support RLS Policies
-- Phase 7.5: Dual admin identity check
-- Covers both user_roles and admin_profiles/admin_roles
-- ============================================

-- ── support_tickets: Admin SELECT ───────────────

DROP POLICY IF EXISTS "Admins can read all tickets" ON support_tickets;

CREATE POLICY "Admins can read all tickets" ON support_tickets
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    OR
    auth.uid() IN (
      SELECT ap.user_id FROM admin_profiles ap
      JOIN admin_roles ar ON ar.id = ap.role_id
      WHERE ar.name IN ('super_admin', 'admin', 'moderator', 'customer_support')
      AND ap.is_active = true
    )
  );

-- ── support_tickets: Admin UPDATE ───────────────

DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;

CREATE POLICY "Admins can update tickets" ON support_tickets
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    OR
    auth.uid() IN (
      SELECT ap.user_id FROM admin_profiles ap
      JOIN admin_roles ar ON ar.id = ap.role_id
      WHERE ar.name IN ('super_admin', 'admin', 'moderator', 'customer_support')
      AND ap.is_active = true
    )
  );

-- ── ticket_messages: Admin SELECT ───────────────

DROP POLICY IF EXISTS "Admins can read all ticket messages" ON ticket_messages;

CREATE POLICY "Admins can read all ticket messages" ON ticket_messages
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
    OR
    auth.uid() IN (
      SELECT ap.user_id FROM admin_profiles ap
      JOIN admin_roles ar ON ar.id = ap.role_id
      WHERE ar.name IN ('super_admin', 'admin', 'moderator', 'customer_support')
      AND ap.is_active = true
    )
  );

-- ── ticket_messages: Admin INSERT ───────────────

DROP POLICY IF EXISTS "Admins can send ticket messages" ON ticket_messages;

CREATE POLICY "Admins can send ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'admin'
    AND (
      auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
      OR
      auth.uid() IN (
        SELECT ap.user_id FROM admin_profiles ap
        JOIN admin_roles ar ON ar.id = ap.role_id
        WHERE ar.name IN ('super_admin', 'admin', 'moderator', 'customer_support')
        AND ap.is_active = true
      )
    )
  );
