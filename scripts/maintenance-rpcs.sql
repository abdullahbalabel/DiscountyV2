-- Maintenance Window Controls — RPCs
-- Run this in the Supabase SQL Editor after maintenance-settings-schema.sql

-- ============================================================
-- 1. get_maintenance_status() — anon callable, auto-checks schedule
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_maintenance_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_row FROM public.maintenance_settings WHERE id = '00000000-0000-0000-0000-000000000001';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'maintenance_settings row not found';
  END IF;

  -- Auto-activate: scheduled window is active
  -- Only if admin hasn't manually disabled AFTER the last activation
  IF v_row.scheduled_start IS NOT NULL
     AND v_row.scheduled_end IS NOT NULL
     AND now() >= v_row.scheduled_start
     AND now() <= v_row.scheduled_end
     AND NOT v_row.is_enabled
     AND (v_row.disabled_at IS NULL OR v_row.disabled_at < v_row.enabled_at) THEN
    UPDATE public.maintenance_settings
      SET is_enabled = true,
          enabled_at = now(),
          updated_at = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    v_row.is_enabled := true;
    v_row.enabled_at := now();
  END IF;

  -- Auto-deactivate: scheduled window has passed
  IF v_row.scheduled_end IS NOT NULL
     AND now() > v_row.scheduled_end
     AND v_row.is_enabled THEN
    UPDATE public.maintenance_settings
      SET is_enabled = false,
          disabled_at = now(),
          scheduled_start = NULL,
          scheduled_end = NULL,
          updated_at = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    v_row.is_enabled := false;
    v_row.disabled_at := now();
    v_row.scheduled_start := NULL;
    v_row.scheduled_end := NULL;
  END IF;

  v_result := json_build_object(
    'is_enabled', v_row.is_enabled,
    'message_title', v_row.message_title,
    'message_body', v_row.message_body,
    'estimated_duration', v_row.estimated_duration,
    'scheduled_start', v_row.scheduled_start,
    'scheduled_end', v_row.scheduled_end
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- 2. set_maintenance_settings() — super_admin only, upsert + audit
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_maintenance_settings(
  p_is_enabled        BOOLEAN,
  p_message_title     TEXT,
  p_message_body      TEXT,
  p_estimated_duration TEXT,
  p_scheduled_start   TIMESTAMPTZ,
  p_scheduled_end     TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
  v_action TEXT;
  v_row JSON;
  v_old_enabled BOOLEAN;
  v_old_scheduled_start TIMESTAMPTZ;
  v_old_scheduled_end TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate super_admin
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    JOIN public.admin_roles ar ON ar.id = ap.role_id
    WHERE ap.user_id = v_user_id
      AND ar.name = 'super_admin'
      AND ap.is_active = true
  ) INTO v_is_super_admin;

  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only super_admin can modify maintenance settings';
  END IF;

  -- Capture old values BEFORE upsert for audit comparison
  SELECT is_enabled, scheduled_start, scheduled_end
    INTO v_old_enabled, v_old_scheduled_start, v_old_scheduled_end
    FROM public.maintenance_settings WHERE id = '00000000-0000-0000-0000-000000000001';

  -- Upsert
  INSERT INTO public.maintenance_settings (
    id, is_enabled, message_title, message_body, estimated_duration,
    scheduled_start, scheduled_end,
    enabled_by, enabled_at, disabled_by, disabled_at,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    p_is_enabled, p_message_title, p_message_body, p_estimated_duration,
    p_scheduled_start, p_scheduled_end,
    CASE WHEN p_is_enabled THEN v_user_id ELSE NULL END,
    CASE WHEN p_is_enabled THEN now() ELSE NULL END,
    CASE WHEN NOT p_is_enabled THEN v_user_id ELSE NULL END,
    CASE WHEN NOT p_is_enabled THEN now() ELSE NULL END,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_enabled = p_is_enabled,
    message_title = p_message_title,
    message_body = p_message_body,
    estimated_duration = p_estimated_duration,
    scheduled_start = p_scheduled_start,
    scheduled_end = p_scheduled_end,
    enabled_by = CASE WHEN p_is_enabled THEN v_user_id ELSE maintenance_settings.enabled_by END,
    enabled_at = CASE WHEN p_is_enabled THEN now() ELSE maintenance_settings.enabled_at END,
    disabled_by = CASE WHEN NOT p_is_enabled THEN v_user_id ELSE maintenance_settings.disabled_by END,
    disabled_at = CASE WHEN NOT p_is_enabled THEN now() ELSE maintenance_settings.disabled_at END,
    updated_at = now();

  -- Audit log (only when enabled state or schedule actually changes)
  IF v_old_enabled IS DISTINCT FROM p_is_enabled THEN
    v_action := CASE WHEN p_is_enabled THEN 'maintenance_enabled' ELSE 'maintenance_disabled' END;
    INSERT INTO public.audit_log (action, resource_type, resource_id, performed_by, performed_at, details)
    VALUES (
      v_action,
      'maintenance',
      NULL,
      v_user_id,
      now(),
      jsonb_build_object(
        'message_title', p_message_title,
        'scheduled_start', p_scheduled_start,
        'scheduled_end', p_scheduled_end
      )
    );
  ELSIF (v_old_scheduled_start IS DISTINCT FROM p_scheduled_start)
     OR (v_old_scheduled_end IS DISTINCT FROM p_scheduled_end) THEN
    INSERT INTO public.audit_log (action, resource_type, resource_id, performed_by, performed_at, details)
    VALUES (
      'maintenance_schedule_updated',
      'maintenance',
      NULL,
      v_user_id,
      now(),
      jsonb_build_object(
        'message_title', p_message_title,
        'scheduled_start', p_scheduled_start,
        'scheduled_end', p_scheduled_end
      )
    );
  END IF;

  -- Return updated row
  SELECT row_to_json(ms) INTO v_row
  FROM public.maintenance_settings ms
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN v_row;
END;
$$;

-- ============================================================
-- 3. cancel_scheduled_maintenance() — super_admin only
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_scheduled_maintenance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
  v_row JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate super_admin
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    JOIN public.admin_roles ar ON ar.id = ap.role_id
    WHERE ap.user_id = v_user_id
      AND ar.name = 'super_admin'
      AND ap.is_active = true
  ) INTO v_is_super_admin;

  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Only super_admin can cancel scheduled maintenance';
  END IF;

  -- Clear schedule only, keep is_enabled as-is
  UPDATE public.maintenance_settings
    SET scheduled_start = NULL,
        scheduled_end = NULL,
        updated_at = now()
    WHERE id = '00000000-0000-0000-0000-000000000001';

  -- Audit log
  INSERT INTO public.audit_log (action, resource_type, resource_id, performed_by, performed_at, details)
  VALUES (
    'maintenance_schedule_cancelled',
    'maintenance',
    NULL,
    v_user_id,
    now(),
    jsonb_build_object('cancelled_by', v_user_id)
  );

  -- Return updated row
  SELECT row_to_json(ms) INTO v_row
  FROM public.maintenance_settings ms
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RETURN v_row;
END;
$$;

-- ============================================================
-- 4. log_audit_event() — authenticated users
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action        TEXT,
  p_resource_type TEXT,
  p_resource_id   TEXT,
  p_details       JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.audit_log (action, resource_type, resource_id, performed_by, performed_at, details)
  VALUES (p_action, p_resource_type, p_resource_id, auth.uid(), now(), p_details)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 5. Grants
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_maintenance_status() TO anon;
GRANT EXECUTE ON FUNCTION public.get_maintenance_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_maintenance_settings(BOOLEAN, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_scheduled_maintenance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, JSONB) TO authenticated;
