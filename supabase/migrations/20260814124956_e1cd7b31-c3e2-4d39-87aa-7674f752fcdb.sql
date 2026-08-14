ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;