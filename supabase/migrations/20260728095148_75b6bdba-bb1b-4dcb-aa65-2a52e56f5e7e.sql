ALTER TABLE public.sms_submissions ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.approve_sms_submission(_submission_id uuid, _rate numeric DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub public.sms_submissions%ROWTYPE;
  _amount numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO _sub FROM public.sms_submissions WHERE id = _submission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  IF _sub.status = 'Approved' THEN
    RETURN;
  END IF;

  _amount := COALESCE(_sub.message_count, 0) * COALESCE(_rate, 1);

  UPDATE public.sms_submissions
    SET status = 'Approved', updated_at = now()
    WHERE id = _submission_id;

  UPDATE public.profiles
    SET wallet_balance = wallet_balance + _amount,
        earned_today = earned_today + _amount,
        total_sms_sent = total_sms_sent + COALESCE(_sub.message_count, 0),
        updated_at = now()
    WHERE id = _sub.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_sms_submission(_submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.sms_submissions
    SET status = 'Rejected', updated_at = now()
    WHERE id = _submission_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_sms_submission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_sms_submission(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_submissions;