REVOKE ALL ON FUNCTION public.approve_sms_submission(uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_sms_submission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_sms_submission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_sms_submission(uuid) TO authenticated;