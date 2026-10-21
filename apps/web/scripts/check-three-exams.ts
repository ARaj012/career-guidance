import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkExams() {
  const exams = ['jee-main', 'upsc-cse', 'cat']
  
  for (const slug of exams) {
    const { data: exam } = await supabase
      .from('exams')
      .select('id, name')
      .eq('slug', slug)
      .single()
    
    if (exam) {
      console.log(`\n${exam.name}:`)
      const { data: schedules } = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('exam_id', exam.id)
        .order('year', { ascending: false })
        .limit(2)
      
      if (schedules && schedules.length > 0) {
        schedules.forEach(s => {
          console.log(`  Year ${s.year}:`)
          console.log(`    Registration: ${s.registration_start} to ${s.registration_end}`)
          console.log(`    Exam: ${s.exam_date_start}`)
          console.log(`    Result: ${s.result_date}`)
        })
      } else {
        console.log('  No schedules found')
      }
    } else {
      console.log(`\nExam ${slug} not found`)
    }
  }
}

checkExams()
