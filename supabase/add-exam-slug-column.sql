-- Add exam_slug column to user_saved_exams table
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

-- Update existing records with exam slug from exams table
UPDATE user_saved_exams use
SET exam_slug = e.slug
FROM exams e
WHERE use.exam_id = e.id 
AND use.exam_slug IS NULL;

-- Verify the update
SELECT 'exam_slug column added and updated' as status;
SELECT COUNT(*) as records_with_slug 
FROM user_saved_exams 
WHERE exam_slug IS NOT NULL;
