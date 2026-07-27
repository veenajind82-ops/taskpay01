CREATE TABLE public.whatsapp_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  screenshot_url text NOT NULL,
  delivered_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_submissions TO authenticated;
GRANT ALL ON public.whatsapp_submissions TO service_role;

ALTER TABLE public.whatsapp_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own whatsapp submissions"
ON public.whatsapp_submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own whatsapp submissions"
ON public.whatsapp_submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all whatsapp submissions"
ON public.whatsapp_submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update whatsapp submissions"
ON public.whatsapp_submissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_submissions_updated_at
BEFORE UPDATE ON public.whatsapp_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();