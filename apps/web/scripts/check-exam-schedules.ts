import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExamSchedules() {
  console.log('🔍 Checking exam schedules in database...\n')
  
  // Get exams
  const { data: exams, error: examsError } = await supabase
    .from('exams')
    .select('id, name, slug')
    .order('name')
  
  if (examsError) {
    console.error('Error fetching exams:', examsError)
    process.exit(1)
  }
  
  console.log('Found exams:', exams?.length)
  console.log('========================\n')
  
  // For each exam, get its schedules
  for (const exam of exams || []) {
    console.log(`📝 Exam: ${exam.name} (slug: ${exam.slug})`)
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('exam_schedules')
      .select('*')
      .eq('exam_id', exam.id)
      .order('year', { ascending: false })
      .limit(1)
    
    if (scheduleError) {
      console.error('  ❌ Error fetching schedules:', scheduleError)
    } else if (schedules && schedules.length > 0) {
      const schedule = schedules[0]
      console.log(`  ✅ Latest schedule (${schedule.year}):`)
      console.log(`     - Registration: ${schedule.registration_start} to ${schedule.registration_end}`)
      console.log(`     - Exam Date: ${schedule.exam_date_start}`)
      console.log(`     - Result Date: ${schedule.result_date}`)
    } else {
      console.log(`  ⚠️ No schedules found`)
    }
    
    console.log('---\n')
  }
}

checkExamSchedules()
