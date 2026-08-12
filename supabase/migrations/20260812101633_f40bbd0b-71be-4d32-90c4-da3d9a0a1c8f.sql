CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  generated_invite_code text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.users TO anon;
GRANT SELECT, INSERT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register a phone number"
  ON public.users FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read registration rows"
  ON public.users FOR SELECT TO anon, authenticated
  USING (true);
