CREATE POLICY "Users can upload their own WhatsApp proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'whatsapp-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own WhatsApp proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'whatsapp-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all WhatsApp proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'whatsapp-proofs' AND public.has_role(auth.uid(), 'admin'::app_role));