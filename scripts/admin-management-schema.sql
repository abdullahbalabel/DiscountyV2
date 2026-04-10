-- Admin Management Schema
-- Run this in the Supabase SQL Editor to add admin user management, groups, and permissions.

-- ============================================================
-- 1. admin_roles — predefined role levels
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default roles
INSERT INTO public.admin_roles (name, description, is_default) VALUES
  ('super_admin', 'Full access to all features and can manage other admins', true),
  ('admin',       'Full access to management features', false),
  ('moderator',   'Can view and edit content but cannot manage admins or groups', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. admin_profiles — extends auth.users for admin-specific data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  role_id      UUID NOT NULL REFERENCES public.admin_roles(id),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. admin_groups — groups for organizing admins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  role_id     UUID NOT NULL REFERENCES public.admin_roles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. admin_group_members — many-to-many between groups and admin profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES public.admin_groups(id) ON DELETE CASCADE,
  admin_profile_id UUID NOT NULL REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, admin_profile_id)
);

-- ============================================================
-- 5. admin_permissions — granular resource/action permissions per role
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id   UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  resource  TEXT NOT NULL,
  action    TEXT NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete', 'manage')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, resource, action)
);

-- Seed permissions for super_admin — full access
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM public.admin_roles r
CROSS JOIN (VALUES ('providers'), ('deals'), ('customers'), ('categories'), ('reviews'), ('notifications'), ('admin_users'), ('groups')) AS res(resource)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete'), ('manage')) AS act(action)
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Seed permissions for admin — all except admin_users management
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM public.admin_roles r
CROSS JOIN (VALUES ('providers'), ('deals'), ('customers'), ('categories'), ('reviews'), ('notifications')) AS res(resource)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS act(action)
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Admin can view admin_users and groups
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, 'view'
FROM public.admin_roles r
CROSS JOIN (VALUES ('admin_users'), ('groups')) AS res(resource)
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Seed permissions for moderator — view + edit on content only
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM public.admin_roles r
CROSS JOIN (VALUES ('providers'), ('deals'), ('customers'), ('categories'), ('reviews')) AS res(resource)
CROSS JOIN (VALUES ('view'), ('edit')) AS act(action)
WHERE r.name = 'moderator'
ON CONFLICT DO NOTHING;

-- Notifications view only for moderator
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, 'notifications', 'view'
FROM public.admin_roles r
WHERE r.name = 'moderator'
ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Admin roles: readable by all authenticated users with admin role
CREATE POLICY "Admin roles readable by authenticated"
  ON public.admin_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin profiles: manage by admins
CREATE POLICY "Admin profiles readable by authenticated"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin profiles insert by authenticated"
  ON public.admin_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin profiles update by authenticated"
  ON public.admin_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin profiles delete by authenticated"
  ON public.admin_profiles FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Admin groups: manage by authenticated
CREATE POLICY "Admin groups readable by authenticated"
  ON public.admin_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin groups insert by authenticated"
  ON public.admin_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin groups update by authenticated"
  ON public.admin_groups FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin groups delete by authenticated"
  ON public.admin_groups FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Admin group members: manage by authenticated
CREATE POLICY "Admin group members readable by authenticated"
  ON public.admin_group_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin group members insert by authenticated"
  ON public.admin_group_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin group members delete by authenticated"
  ON public.admin_group_members FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Admin permissions: readable by authenticated, managed by super_admin via code
CREATE POLICY "Admin permissions readable by authenticated"
  ON public.admin_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin permissions insert by authenticated"
  ON public.admin_permissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin permissions update by authenticated"
  ON public.admin_permissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin permissions delete by authenticated"
  ON public.admin_permissions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_role_id ON public.admin_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_is_active ON public.admin_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_group_members_group_id ON public.admin_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_admin_group_members_profile_id ON public.admin_group_members(admin_profile_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role_id ON public.admin_permissions(role_id);
