CREATE OR REPLACE FUNCTION public.submit_review(p_redemption_id uuid, p_rating smallint, p_comment text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_auth_id uuid;
  v_customer_id uuid;
  v_redemption record;
  v_review_id uuid;
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

  SELECT r.*, d.provider_id
  INTO v_redemption
  FROM public.redemptions r
  JOIN public.discounts d ON d.id = r.discount_id
  WHERE r.id = p_redemption_id AND r.customer_id = v_customer_id;

  IF v_redemption IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Redemption not found');
  END IF;

  IF v_redemption.status != 'redeemed' THEN
    RETURN json_build_object('success', false, 'error', 'Can only review redeemed deals');
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews WHERE redemption_id = p_redemption_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  INSERT INTO public.reviews (provider_id, customer_id, redemption_id, rating, comment)
  VALUES (v_redemption.provider_id, v_customer_id, p_redemption_id, p_rating, p_comment)
  RETURNING id INTO v_review_id;

  UPDATE public.provider_profiles
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
      FROM public.reviews WHERE provider_id = v_redemption.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM public.reviews WHERE provider_id = v_redemption.provider_id
    )
  WHERE id = v_redemption.provider_id;

  RETURN json_build_object(
    'success', true,
    'review_id', v_review_id
  );
END;
$function$;
