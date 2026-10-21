import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkJeeMainSessions() {
  console.log('🔍 Checking JEE Main sessions...\n')
  
  const { data: exam } = await supabase
    .from('exams')
    .select('id, name')
    .eq('slug', 'jee-main')
    .single()
  
  if (exam) {
    const { data: schedules } = await supabase
      .from('exam_schedules')
      .select('*')
      .eq('exam_id', exam.id)
      .eq('year', 2027)
      .order('session')
    
    if (schedules && schedules.length > 0) {
      console.log(`JEE Main 2027 schedules (${schedules.length} records):`)
      schedules.forEach(s => {
        console.log(`  Session: ${s.session || 'NULL'}`)
        console.log(`    Registration: ${s.registration_start} to ${s.registration_end}`)
        console.log(`    Exam: ${s.exam_date_start}`)
        console.log(`    Result: ${s.result_date}`)
        console.log()
      })
    } else {
      console.log('No 2027 schedules found')
    }
  }
}

checkJeeMainSessions()
