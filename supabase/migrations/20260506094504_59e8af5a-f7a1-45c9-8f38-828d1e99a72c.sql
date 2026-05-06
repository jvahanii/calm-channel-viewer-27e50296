CREATE POLICY "Users can upgrade themselves"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own role"
  ON public.user_roles FOR DELETE
  USING (auth.uid() = user_id);