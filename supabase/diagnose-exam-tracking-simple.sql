-- ============================================
-- SIMPLE DIAGNOSTIC SCRIPT (NO COLUMN ASSUMPTIONS)
-- ============================================

-- Step 1: Check what exams exist (use * to see all columns)
SELECT * FROM exams LIMIT 5;

-- Step 2: Check what's currently in user_saved_exams
SELECT * FROM user_saved_exams
WHERE user_id = '3b8d0160-d959-47f0-963e-53b49079ae98';

-- Step 3: Find the mismatch - tracked exam IDs that don't exist in exams table
SELECT use.* 
FROM user_saved_exams use
LEFT JOIN exams e ON use.exam_id = e.id
WHERE e.id IS NULL
AND use.user_id = '3b8d0160-d959-47f0-963e-53b49079ae98';

-- Step 4: Count total exams
SELECT COUNT(*) as total_exams FROM exams;
