-- ============================================
-- FIX SCRIPT FOR EXAM TRACKING DATABASE ISSUES
-- ============================================

-- Step 1: Clean up bad tracking data for the specific user
DELETE FROM user_saved_exams 
WHERE user_id = '3b8d0160-d959-47f0-963e-53b49079ae98'
AND exam_id NOT IN (SELECT id FROM exams);

-- Step 2: Add exam_slug column to user_saved_exams for reliable tracking
-- This allows us to track exams by slug even if IDs change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_saved_exams' 
        AND column_name = 'exam_slug'
    ) THEN
        ALTER TABLE user_saved_exams ADD COLUMN exam_slug TEXT;
    END IF;
END $$;

-- Step 3: Update existing records to populate exam_slug
UPDATE user_saved_exams use
SET exam_slug = e.slug
FROM exams e
WHERE use.exam_id = e.id AND use.exam_slug IS NULL;

-- Step 4: Create a unique constraint on user_id and exam_slug as an alternative
-- This allows tracking by slug if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_saved_exams_user_slug_unique'
    ) THEN
        ALTER TABLE user_saved_exams 
        ADD CONSTRAINT user_saved_exams_user_slug_unique 
        UNIQUE (user_id, exam_slug);
    END IF;
END $$;

-- Step 5: Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own saved exams" ON user_saved_exams;
CREATE POLICY "Users can view their own saved exams"
  ON user_saved_exams FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved exams" ON user_saved_exams;
CREATE POLICY "Users can insert their own saved exams"
  ON user_saved_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved exams" ON user_saved_exams;
CREATE POLICY "Users can update their own saved exams"
  ON user_saved_exams FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved exams" ON user_saved_exams;
CREATE POLICY "Users can delete their own saved exams"
  ON user_saved_exams FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Ensure exams table has proper RLS policies
DROP POLICY IF EXISTS "Public can view exams" ON exams;
CREATE POLICY "Public can view exams"
  ON exams FOR SELECT
  USING (true);

-- Step 7: Verify the fix
SELECT 'Cleanup completed' as status;
SELECT COUNT(*) as remaining_bad_records 
FROM user_saved_exams 
WHERE user_id = '3b8d0160-d959-47f0-963e-53b49079ae98'
AND exam_id NOT IN (SELECT id FROM exams);
