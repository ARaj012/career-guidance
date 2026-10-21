import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function resetExams2027() {
  console.log('🔄 Resetting UPSC and CAT 2027 schedules...\n')
  
  const slugs = ['upsc-cse', 'cat']
  
  for (const slug of slugs) {
    const { data: exam } = await supabase
      .from('exams')
      .select('id, name')
      .eq('slug', slug)
      .single()
    
    if (exam) {
      const { error } = await supabase
        .from('exam_schedules')
        .delete()
        .eq('exam_id', exam.id)
        .eq('year', 2027)
      
      if (error) {
        console.error(`❌ Error deleting ${slug}:`, error)
      } else {
        console.log(`✅ Deleted all ${slug} 2027 schedules`)
      }
    }
  }
  
  console.log('\nRun automation again to recreate')
}

resetExams2027()
