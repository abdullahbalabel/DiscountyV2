CREATE OR REPLACE FUNCTION public.claim_deal(p_deal_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_id uuid;
  v_customer_id uuid;
  v_deal record;
  v_active_slots int;
  v_already_claimed bool;
  v_qr_hash varchar;
  v_redemption_id uuid;
BEGIN
  v_auth_id := auth.uid();
  IF v_auth_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id INTO v_customer_id FROM public.customer_profiles WHERE user_id = v_auth_id;
  IF v_customer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Customer profile not found');
  END IF;

  -- Check if customer is banned
  IF EXISTS (SELECT 1 FROM public.customer_profiles WHERE id = v_customer_id AND is_banned = true) THEN
    RETURN json_build_object('success', false, 'error', 'Your account has been suspended');
  END IF;

  SELECT * INTO v_deal FROM public.discounts
  WHERE id = p_deal_id AND status = 'active'
    AND start_time <= now() AND end_time > now();
  IF v_deal IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Deal not found or not active');
  END IF;

  IF v_deal.current_redemptions >= v_deal.max_redemptions THEN
    RETURN json_build_object('success', false, 'error', 'Deal is fully claimed');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.redemptions
    WHERE discount_id = p_deal_id AND customer_id = v_customer_id
      AND status IN ('claimed', 'redeemed')
  ) INTO v_already_claimed;
  IF v_already_claimed THEN
    RETURN json_build_object('success', false, 'error', 'You already claimed this deal');
  END IF;

  SELECT COUNT(*) INTO v_active_slots
  FROM public.redemptions r
  WHERE r.customer_id = v_customer_id
    AND (
      r.status = 'claimed'
      OR (
        r.status = 'redeemed'
        AND NOT EXISTS (
          SELECT 1 FROM public.reviews rv WHERE rv.redemption_id = r.id
        )
      )
    );
  IF v_active_slots >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'All 3 deal slots are occupied. Review a redeemed deal to free a slot.');
  END IF;

  v_qr_hash := md5(gen_random_uuid()::text || p_deal_id::text || now()::text || random()::text);

  INSERT INTO public.redemptions (discount_id, customer_id, qr_code_hash, status)
  VALUES (p_deal_id, v_customer_id, v_qr_hash, 'claimed')
  RETURNING id INTO v_redemption_id;

  UPDATE public.discounts
  SET current_redemptions = current_redemptions + 1
  WHERE id = p_deal_id;

  RETURN json_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'qr_code_hash', v_qr_hash
  );
END;
$function$;
