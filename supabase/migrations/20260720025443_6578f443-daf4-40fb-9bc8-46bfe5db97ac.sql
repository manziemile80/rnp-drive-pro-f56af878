
CREATE OR REPLACE FUNCTION public.redeem_access_token(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_token public.access_tokens%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_token FROM public.access_tokens
    WHERE code = upper(_code) LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid access token';
  END IF;
  IF v_token.revoked THEN
    RAISE EXCEPTION 'This token has been revoked';
  END IF;
  IF v_token.assigned_to IS NOT NULL AND v_token.assigned_to <> v_uid THEN
    RAISE EXCEPTION 'This token has already been used by another account';
  END IF;
  IF v_token.assigned_to = v_uid THEN
    RETURN v_token.id;
  END IF;

  UPDATE public.access_tokens
    SET assigned_to = v_uid, redeemed_at = now()
    WHERE id = v_token.id AND assigned_to IS NULL;

  RETURN v_token.id;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_access_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_access_token(text) TO authenticated;
