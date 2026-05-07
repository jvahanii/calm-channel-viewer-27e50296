CREATE TABLE public.hidden_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

ALTER TABLE public.hidden_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hidden videos"
  ON public.hidden_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hidden videos"
  ON public.hidden_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hidden videos"
  ON public.hidden_videos FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_hidden_videos_user ON public.hidden_videos(user_id);