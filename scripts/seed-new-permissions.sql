-- =============================================
-- Seed permissions for support_tickets & data_requests
-- Run this in the Supabase SQL Editor
-- =============================================

-- super_admin — full access to support_tickets & data_requests
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM public.admin_roles r
CROSS JOIN (VALUES ('support_tickets'), ('data_requests'), ('deal_conditions'), ('reports')) AS res(resource)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete'), ('manage')) AS act(action)
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin — view + edit on support_tickets & data_requests
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM public.admin_roles r
CROSS JOIN (VALUES ('support_tickets'), ('data_requests'), ('deal_conditions'), ('reports')) AS res(resource)
CROSS JOIN (VALUES ('view'), ('edit')) AS act(action)
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- moderator — view only on support_tickets & data_requests
INSERT INTO public.admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, 'view'
FROM public.admin_roles r
CROSS JOIN (VALUES ('support_tickets'), ('data_requests'), ('deal_conditions'), ('reports')) AS res(resource)
WHERE r.name = 'moderator'
ON CONFLICT DO NOTHING;
