-- Add session column to exam_schedules table
-- This allows exams with multiple sessions per year (e.g., JEE Main Session 1 & 2)

ALTER TABLE public.exam_schedules
ADD COLUMN IF NOT EXISTS session TEXT;

-- Add comment
COMMENT ON COLUMN public.exam_schedules.session IS 'Session identifier for exams with multiple sessions per year (e.g., "Session 1", "Session 2", "Both")';

-- Create unique constraint to prevent duplicate exam_id + year + session combinations
ALTER TABLE public.exam_schedules
DROP CONSTRAINT IF EXISTS exam_schedules_exam_id_year_key;

ALTER TABLE public.exam_schedules
ADD CONSTRAINT exam_schedules_exam_id_year_session_key
UNIQUE (exam_id, year, session);
