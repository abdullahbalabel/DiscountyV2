-- Seed subscription-related permissions for existing admin roles
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- Run in Supabase SQL Editor

-- super_admin: full access to all 3 subscription resources
INSERT INTO admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, act.action
FROM admin_roles r
CROSS JOIN (VALUES
  ('subscription_plans'),
  ('subscriptions'),
  ('stripe_settings')
) AS res(resource)
CROSS JOIN (VALUES
  ('view'),
  ('create'),
  ('edit'),
  ('delete'),
  ('manage')
) AS act(action)
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- admin: view + create + edit for subscription_plans
INSERT INTO admin_permissions (role_id, resource, action)
SELECT r.id, 'subscription_plans', act.action
FROM admin_roles r
CROSS JOIN (VALUES ('view'), ('create'), ('edit')) AS act(action)
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- admin: view + edit for subscriptions
INSERT INTO admin_permissions (role_id, resource, action)
SELECT r.id, 'subscriptions', act.action
FROM admin_roles r
CROSS JOIN (VALUES ('view'), ('edit')) AS act(action)
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- admin: view only for stripe_settings
INSERT INTO admin_permissions (role_id, resource, action)
SELECT r.id, 'stripe_settings', 'view'
FROM admin_roles r
WHERE r.name = 'admin'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- moderator: view only for subscription_plans and subscriptions
INSERT INTO admin_permissions (role_id, resource, action)
SELECT r.id, res.resource, 'view'
FROM admin_roles r
CROSS JOIN (VALUES ('subscription_plans'), ('subscriptions')) AS res(resource)
WHERE r.name = 'moderator'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- customer_support: no subscription permissions (intentionally omitted)
