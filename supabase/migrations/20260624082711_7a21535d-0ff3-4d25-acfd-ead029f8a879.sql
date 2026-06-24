ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hide_shorts boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shorts_limit integer NOT NULL DEFAULT 5 CHECK (shorts_limit BETWEEN 1 AND 60);