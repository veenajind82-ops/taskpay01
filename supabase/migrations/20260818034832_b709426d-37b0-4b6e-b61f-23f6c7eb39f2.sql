ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.set_user_points(_user_id uuid, _points numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _points IS NULL OR _points < 0 THEN RAISE EXCEPTION 'Invalid points value'; END IF;
  UPDATE public.profiles SET points = _points, updated_at = now() WHERE id = _user_id;
END;
$$;