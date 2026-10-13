-- ============================================
-- DIAGNOSTIC SCRIPT FOR EXAM TRACKING ISSUE
-- ============================================

-- Step 1: Check what exams exist in the database
SELECT id, title, slug, conducting_body 
FROM exams 
LIMIT 10;

-- Step 2: Check what's currently in user_saved_exams
SELECT id, user_id, exam_id, tracking_type, created_at
FROM user_saved_exams
WHERE user_id = '3b8d0160-d959-47f0-963e-53b49079ae98';

-- Step 3: Find the mismatch - tracked exam IDs that don't exist in exams table
SELECT use.id as tracking_id, use.exam_id, use.user_id, use.tracking_type
FROM user_saved_exams use
LEFT JOIN exams e ON use.exam_id = e.id
WHERE e.id IS NULL
AND use.user_id = '3b8d0160-d959-47f0-963e-53b49079ae98';

-- Step 4: Check if there are any exams at all
SELECT COUNT(*) as total_exams FROM exams;

-- Step 5: Check the actual exam that should exist (based on slug 'afcat')
SELECT id, title, slug, conducting_body 
FROM exams 
WHERE slug = 'afcat' OR slug LIKE '%afcat%';

-- Step 6: Check if RLS policies might be blocking access
SELECT * FROM pg_policies 
WHERE tablename = 'exams' OR tablename = 'user_saved_exams';
