-- Seed permissions for deal_conditions and reports resources
-- Run this in Supabase SQL Editor after admin-management-schema.sql

-- super_admin: full access (view, create, edit, delete, manage)
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res, act
FROM admin_roles r
CROSS JOIN (VALUES ('deal_conditions'), ('reports')) AS t(res)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete'), ('manage')) AS a(act)
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- admin: view, create, edit, delete (no manage)
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res, act
FROM admin_roles r
CROSS JOIN (VALUES ('deal_conditions'), ('reports')) AS t(res)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS a(act)
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- moderator: view, edit only
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res, act
FROM admin_roles r
CROSS JOIN (VALUES ('deal_conditions'), ('reports')) AS t(res)
CROSS JOIN (VALUES ('view'), ('edit')) AS a(act)
WHERE r.name = 'moderator'
ON CONFLICT (role_id, resource, action) DO NOTHING;
