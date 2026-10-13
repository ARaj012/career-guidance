-- ============================================
-- CHECK TABLE STRUCTURE - FIND CORRECT COLUMN NAMES
-- ============================================

-- Check what columns exist in the exams table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exams'
ORDER BY ordinal_position;

-- Check what columns exist in user_saved_exams table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_saved_exams'
ORDER BY ordinal_position;

-- Get a sample of actual exam data to see the structure
SELECT * FROM exams LIMIT 1;
