-- ============================================================
-- 008_create_voices_table.sql
-- Creates the voices table and inserts all OpenAI voices.
-- Run this AFTER 007_drop_prompt_history.sql
-- ============================================================

-- Create the voices table
CREATE TABLE IF NOT EXISTS public.voices (
    id SERIAL PRIMARY KEY,
    voice_id VARCHAR(255) UNIQUE NOT NULL,
    voice_type VARCHAR(50),
    standard_voice_type VARCHAR(50),
    voice_name VARCHAR(100),
    provider VARCHAR(50),
    accent VARCHAR(50),
    gender VARCHAR(20),
    age VARCHAR(50),
    avatar_url TEXT,
    preview_audio_url TEXT,
    s2s_model VARCHAR(100) DEFAULT 'gpt-realtime-mini',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on voice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_id ON public.voices(voice_id);
CREATE INDEX IF NOT EXISTS idx_provider ON public.voices(provider);

-- Insert all OpenAI voices
INSERT INTO public.voices (voice_id, voice_type, standard_voice_type, voice_name, provider, accent, gender, age, avatar_url, preview_audio_url) VALUES
('openai-Nova', 'standard', 'preset', 'Nova', 'openai', 'American', 'female', 'Old', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/nova.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/nova_.wav'),
('openai-Marissa', 'standard', 'retell', 'Marissa', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Marissa.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96d2cdf881919d198e26029928f4.mp3'),
('openai-Julia', 'standard', 'retell', 'Julia', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Julia.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96bc832481918fff5698b45cc94a.mp3'),
('openai-Echo', 'standard', 'preset', 'Echo', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/echo.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/echo_.wav'),
('openai-Adrian', 'standard', 'retell', 'Adrian', 'openai', 'American', 'male', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/adrian.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b9635d324819181f8de05446c55d4.mp3'),
('openai-Fable', 'standard', 'preset', 'Fable', 'openai', 'British', 'male', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/fable.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/fable_.wav'),
('openai-Ash', 'standard', 'preset', 'Ash', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Ash.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-ash.wav'),
('openai-Santiago', 'standard', 'retell', 'Santiago', 'openai', 'Spanish', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Santiago.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96efc9d48191817acae4c367f52a.mp3'),
('openai-Coral', 'standard', 'preset', 'Coral', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Coral.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-coral.wav'),
('openai-Cedar', 'standard', 'preset', 'Cedar', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/customvoice-icon.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-cedar.mp3'),
('openai-Shimmer', 'standard', 'preset', 'Shimmer', 'openai', 'American', 'female', 'Old', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/shimmer.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/shimmer_.wav'),
('openai-Anna', 'standard', 'retell', 'Anna', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/anna.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96664050819189fef02cea813b25.mp3'),
('openai-Marin', 'standard', 'preset', 'Marin', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/customvoice-icon.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-marin.mp3'),
('openai-Zuri', 'standard', 'retell', 'Zuri', 'openai', 'American', 'female', 'Old', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Zuri.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96fec880819183c5b0fa20312a0b.mp3'),
('openai-Verse', 'standard', 'preset', 'Verse', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/customvoice-icon.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-verse.mp3'),
('openai-Anthony', 'standard', 'retell', 'Anthony', 'openai', 'British', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/anthony.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b966dc3f88191b45f3f27c769425f.mp3'),
('openai-Andrew', 'standard', 'retell', 'Andrew', 'openai', 'American', 'male', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/andrew.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b9659e9d48191a5daa5714ea5e2b2.mp3'),
('openai-Chloe', 'standard', 'retell', 'Chloe', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Chloe.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96859f9c8191af4779719ea0458c.mp3'),
('openai-Susan', 'standard', 'retell', 'Susan', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Susan.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96f7be508191b78ddf92e3872262.mp3'),
('openai-Monika', 'standard', 'retell', 'Monika', 'openai', 'Indian', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/monika.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96da1d448191ab648005a2d6be94.mp3'),
('openai-Brian', 'standard', 'retell', 'Brian', 'openai', 'American', 'male', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/brian.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b967556d48191aceba05581f74c92.mp3'),
('openai-Myra', 'standard', 'retell', 'Myra', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Myra.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96e166b48191954447ee469ac488.mp3'),
('openai-Amy', 'standard', 'retell', 'Amy', 'openai', 'British', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/valeria.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b9646e62c81919d4db38e527b7a54.mp3'),
('openai-Kathrine', 'standard', 'retell', 'Kathrine', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/kathrine.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96cb795c819193a7bf9ee952880d.mp3'),
('openai-Alloy', 'standard', 'preset', 'Alloy ', 'openai', 'American', 'male', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/alloy-update.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/alloy_.wav'),
('openai-Ballad', 'standard', 'preset', 'Ballad', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/customvoice-icon.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-ballad.mp3'),
('openai-Sage', 'standard', 'preset', 'Sage', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Sage.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-sage.wav'),
('openai-Kate', 'standard', 'retell', 'Kate', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Kate.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96c3febc81918df0fa1d62dd3011.mp3'),
('openai-Carola', 'standard', 'retell', 'Carola', 'openai', 'German', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/carola.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b967e04b881918767a95c4170b388.mp3'),
('openai-Emily', 'standard', 'retell', 'Emily', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/emily.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b969054208191bff550c40d405409.mp3'),
('openai-Cimo', 'standard', 'retell', 'Cimo', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/cimo.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_684707cb30608190a5037cdb24f1a0e1.mp3'),
('openai-Grace', 'standard', 'retell', 'Grace', 'openai', 'American', 'female', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/grace.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689bb0e735408191baa1cdb74693ec77.mp3'),
('openai-Onyx', 'standard', 'preset', 'Onyx ', 'openai', 'American', 'male', 'Middle Aged', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/onyx.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/onyx_.wav'),
('openai-Paola', 'standard', 'retell', 'Paola', 'openai', 'American', 'female', 'Young', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/Paola.png', 'https://retell-utils-public.s3.us-west-2.amazonaws.com/openai-voice_689b96e8af288191b1933572f87e979c.mp3')
ON CONFLICT (voice_id) DO NOTHING;

-- Enable RLS on voices table (read-only for all authenticated users)
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for voices (read-only for all authenticated users)
CREATE POLICY "voices_select_all" ON public.voices
  FOR SELECT USING (true);  -- Anyone can read voices

-- Done! Voices table is ready with all OpenAI voices.
