ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending_approval',
  ALTER COLUMN invitation_code SET DEFAULT '',
  ALTER COLUMN username SET DEFAULT '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _phone text;
BEGIN
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
  INSERT INTO public.profiles (id, phone, username, invitation_code, referred_by, status)
  VALUES (
    NEW.id,
    _phone,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), _phone),
    '',
    NULL,
    CASE WHEN right(regexp_replace(_phone, '\D', '', 'g'), 10) = '8307796711' THEN 'active' ELSE 'pending_approval' END
  );
  RETURN NEW;
END;
$function$;

-- existing users keep working
UPDATE public.profiles SET status = 'active' WHERE invitation_code <> '' AND invitation_code IS NOT NULL;

-- admins need to see and approve pending registrations
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.approve_user(_user_id uuid, _invitation_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _invitation_code IS NULL OR btrim(_invitation_code) = '' THEN RAISE EXCEPTION 'Invitation code required'; END IF;

  UPDATE public.profiles
    SET invitation_code = upper(btrim(_invitation_code)),
        status = 'active',
        updated_at = now()
    WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET status = 'rejected', updated_at = now() WHERE id = _user_id;
END;
$function$;