CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  upi_id text NOT NULL,
  account_name text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own withdrawals"
  ON public.withdrawal_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own withdrawals"
  ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawal_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Request a withdrawal: holds the amount from the wallet immediately
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _upi_id text, _account_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.profiles%ROWTYPE;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO _p FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _p.wallet_balance < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  UPDATE public.profiles
    SET wallet_balance = wallet_balance - _amount, updated_at = now()
    WHERE id = _uid;

  INSERT INTO public.withdrawal_requests (user_id, amount, upi_id, account_name, phone)
  VALUES (_uid, _amount, _upi_id, _account_name, _p.phone)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.withdrawal_requests
    SET status = 'Approved', updated_at = now()
    WHERE id = _request_id AND status = 'Pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_request_id uuid, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _r public.withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO _r FROM public.withdrawal_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND OR _r.status <> 'Pending' THEN RETURN; END IF;

  UPDATE public.withdrawal_requests
    SET status = 'Rejected', admin_note = _note, updated_at = now()
    WHERE id = _request_id;

  UPDATE public.profiles
    SET wallet_balance = wallet_balance + _r.amount, updated_at = now()
    WHERE id = _r.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_whatsapp_submission(_submission_id uuid, _rate numeric DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sub public.whatsapp_submissions%ROWTYPE;
  _amount numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO _sub FROM public.whatsapp_submissions WHERE id = _submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF _sub.status = 'Approved' THEN RETURN; END IF;

  _amount := COALESCE(_sub.delivered_count, 0) * COALESCE(_rate, 1);

  UPDATE public.whatsapp_submissions
    SET status = 'Approved', updated_at = now()
    WHERE id = _submission_id;

  UPDATE public.profiles
    SET wallet_balance = wallet_balance + _amount,
        earned_today = earned_today + _amount,
        active_whatsapp = active_whatsapp + COALESCE(_sub.delivered_count, 0),
        updated_at = now()
    WHERE id = _sub.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_whatsapp_submission(_submission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.whatsapp_submissions
    SET status = 'Rejected', updated_at = now()
    WHERE id = _submission_id;
END;
$$;