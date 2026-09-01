-- Add state fields to user_profiles for better scholarship matching
-- Run this in Supabase SQL Editor

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS class10_state TEXT,
ADD COLUMN IF NOT EXISTS class12_state TEXT,
ADD COLUMN IF NOT EXISTS belonging_state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.class10_state IS 'State where the user studied Class 10';
COMMENT ON COLUMN public.user_profiles.class12_state IS 'State where the user studied Class 12';
COMMENT ON COLUMN public.user_profiles.belonging_state IS 'State of domicile/belonging for scholarship eligibility';
