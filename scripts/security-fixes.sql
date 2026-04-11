-- ============================================
-- Security Fixes — 2026-04-11
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================================
-- Phase 1: Admin RLS Privilege Escalation (Critical)
-- ============================================================

-- Fix admin_roles policies
DROP POLICY IF EXISTS "Admin roles readable by authenticated" ON public.admin_roles;

CREATE POLICY "Anyone can view admin roles"
  ON public.admin_roles FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE via RLS — managed only by service role / Edge Function

-- Fix admin_profiles policies
DROP POLICY IF EXISTS "Admin profiles readable by authenticated" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admin profiles insert by authenticated" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admin profiles update by authenticated" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admin profiles delete by authenticated" ON public.admin_profiles;

CREATE POLICY "Active admins can view admin profiles"
  ON public.admin_profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_profiles WHERE is_active = true
    )
  );

-- No INSERT/UPDATE/DELETE via RLS — managed only by manage-admin Edge Function

-- Fix admin_groups policies
DROP POLICY IF EXISTS "Admin groups readable by authenticated" ON public.admin_groups;
DROP POLICY IF EXISTS "Admin groups insert by authenticated" ON public.admin_groups;
DROP POLICY IF EXISTS "Admin groups update by authenticated" ON public.admin_groups;
DROP POLICY IF EXISTS "Admin groups delete by authenticated" ON public.admin_groups;

CREATE POLICY "Active admins can view admin groups"
  ON public.admin_groups FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_profiles WHERE is_active = true
    )
  );

CREATE POLICY "Super admins can manage admin groups"
  ON public.admin_groups FOR ALL
  USING (
    auth.uid() IN (
      SELECT ap.user_id FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.is_active = true AND ar.name = 'super_admin'
    )
  );

-- Fix admin_group_members policies
DROP POLICY IF EXISTS "Admin group members readable by authenticated" ON public.admin_group_members;
DROP POLICY IF EXISTS "Admin group members insert by authenticated" ON public.admin_group_members;
DROP POLICY IF EXISTS "Admin group members delete by authenticated" ON public.admin_group_members;

CREATE POLICY "Active admins can view group members"
  ON public.admin_group_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_profiles WHERE is_active = true
    )
  );

CREATE POLICY "Super admins can manage group members"
  ON public.admin_group_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT ap.user_id FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.is_active = true AND ar.name = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete group members"
  ON public.admin_group_members FOR DELETE
  USING (
    auth.uid() IN (
      SELECT ap.user_id FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.is_active = true AND ar.name = 'super_admin'
    )
  );

-- Fix admin_permissions policies
DROP POLICY IF EXISTS "Admin permissions readable by authenticated" ON public.admin_permissions;
DROP POLICY IF EXISTS "Admin permissions insert by authenticated" ON public.admin_permissions;
DROP POLICY IF EXISTS "Admin permissions update by authenticated" ON public.admin_permissions;
DROP POLICY IF EXISTS "Admin permissions delete by authenticated" ON public.admin_permissions;

CREATE POLICY "Active admins can view permissions"
  ON public.admin_permissions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.admin_profiles WHERE is_active = true
    )
  );

CREATE POLICY "Super admins can manage permissions"
  ON public.admin_permissions FOR ALL
  USING (
    auth.uid() IN (
      SELECT ap.user_id FROM public.admin_profiles ap
      JOIN public.admin_roles ar ON ar.id = ap.role_id
      WHERE ap.is_active = true AND ar.name = 'super_admin'
    )
  );

-- ============================================================
-- Phase 2: Notifications Insert Abuse (High)
-- ============================================================

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

CREATE POLICY "Active admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.admin_profiles WHERE is_active = true
    )
  );

-- ============================================================
-- Phase 3: Overly Permissive SELECT Policies (High)
-- ============================================================

-- 3.1 — Drop permissive duplicate policies
DROP POLICY IF EXISTS "discounts_select_active" ON public.discounts;
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "provider_profiles_select_all" ON public.provider_profiles;

-- 3.2 — Remove other duplicate policies
DROP POLICY IF EXISTS "customer_profiles_insert_own" ON public.customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_select_own" ON public.customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_update_own" ON public.customer_profiles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "provider_profiles_insert_own" ON public.provider_profiles;
DROP POLICY IF EXISTS "provider_profiles_update_own" ON public.provider_profiles;
DROP POLICY IF EXISTS "discounts_insert_provider" ON public.discounts;
DROP POLICY IF EXISTS "discounts_update_provider" ON public.discounts;
DROP POLICY IF EXISTS "reviews_update_reply" ON public.reviews;

-- 3.3 — Admin policies must check is_active

-- categories
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Active admins can manage categories" ON public.categories
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- discounts
DROP POLICY IF EXISTS "Admins can view all discounts" ON public.discounts;
DROP POLICY IF EXISTS "Admins can update discounts" ON public.discounts;
DROP POLICY IF EXISTS "Admins can delete discounts" ON public.discounts;

CREATE POLICY "Active admins can manage discounts" ON public.discounts
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- redemptions
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can delete redemptions" ON public.redemptions;

CREATE POLICY "Active admins can manage redemptions" ON public.redemptions
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- reviews
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;

CREATE POLICY "Active admins can manage reviews" ON public.reviews
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

CREATE POLICY "Active admins can manage notifications" ON public.notifications
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- customer_profiles
DROP POLICY IF EXISTS "Admins can view all customer profiles" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins can update customer profiles" ON public.customer_profiles;
DROP POLICY IF EXISTS "Admins can delete customer profiles" ON public.customer_profiles;

CREATE POLICY "Active admins can manage customer profiles" ON public.customer_profiles
  FOR ALL
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- provider_profiles
DROP POLICY IF EXISTS "Admins can update provider profiles" ON public.provider_profiles;

CREATE POLICY "Active admins can update provider profiles" ON public.provider_profiles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles WHERE is_active = true)
  );

-- ============================================================
-- Verification
-- ============================================================

-- Check for any remaining permissive policies on admin tables
SELECT 'Admin permissive policies remaining: ' || count(*)::text
FROM pg_policies
WHERE tablename IN ('admin_roles','admin_profiles','admin_groups','admin_group_members','admin_permissions')
  AND (qual = 'true' OR with_check = 'true');
-- Should return 0
