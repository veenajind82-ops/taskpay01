
CREATE POLICY "Users can upload their own SMS proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sms-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own SMS proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sms-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all SMS proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sms-proofs' AND public.has_role(auth.uid(), 'admin'));
