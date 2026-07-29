CREATE TABLE public.whatsapp_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_phone text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  binding_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_bindings TO authenticated;
GRANT ALL ON public.whatsapp_bindings TO service_role;

ALTER TABLE public.whatsapp_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own bindings" ON public.whatsapp_bindings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own bindings" ON public.whatsapp_bindings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bindings" ON public.whatsapp_bindings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update bindings" ON public.whatsapp_bindings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_bindings_updated_at
  BEFORE UPDATE ON public.whatsapp_bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_bindings;