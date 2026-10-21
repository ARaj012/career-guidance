import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function resetJeeMain2027() {
  console.log('🔄 Resetting JEE Main 2027 schedules...\n')
  
  const { data: exam } = await supabase
    .from('exams')
    .select('id, name')
    .eq('slug', 'jee-main')
    .single()
  
  if (exam) {
    const { error } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('exam_id', exam.id)
      .eq('year', 2027)
    
    if (error) {
      console.error('❌ Error deleting:', error)
    } else {
      console.log('✅ Deleted all JEE Main 2027 schedules')
      console.log('Run automation again to recreate with proper sessions')
    }
  }
}

resetJeeMain2027()
