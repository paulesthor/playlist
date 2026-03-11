-- You can run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.listening_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    track_id text NOT NULL,
    track_name text NOT NULL,
    artist_name text,
    album_name text,
    album_image text,
    listened_at timestamp with time zone DEFAULT now(),
    duration_ms integer,
    genres jsonb,
    bpm real,
    danceability real,
    energy real,
    valence real,
    acousticness real,
    speechiness real,
    instrumentalness real,
    key integer,
    mode integer,
    liveness real,
    loudness real,
    time_signature integer,
    popularity integer,
    explicit boolean,
    release_date text
);

-- Optional: Create an index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON public.listening_history(user_id);

-- ⚠️ If you ALREADY created the table from the previous step, just run these ALTER statements to update it:
/*
ALTER TABLE public.listening_history
ADD COLUMN IF NOT EXISTS key integer,
ADD COLUMN IF NOT EXISTS mode integer,
ADD COLUMN IF NOT EXISTS liveness real,
ADD COLUMN IF NOT EXISTS loudness real,
ADD COLUMN IF NOT EXISTS time_signature integer,
ADD COLUMN IF NOT EXISTS popularity integer,
ADD COLUMN IF NOT EXISTS explicit boolean,
ADD COLUMN IF NOT EXISTS release_date text;
*/
