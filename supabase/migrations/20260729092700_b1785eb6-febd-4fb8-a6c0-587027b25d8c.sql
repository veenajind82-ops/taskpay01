ALTER TABLE public.sms_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_bindings REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;