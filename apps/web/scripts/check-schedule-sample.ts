import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkSample() {
  console.log('🔍 Checking exam_schedules sample record...\n')
  
  const { data: schedules } = await supabase
    .from('exam_schedules')
    .select('*')
    .limit(1)
  
  if (schedules && schedules.length > 0) {
    console.log('Sample record:')
    console.log(JSON.stringify(schedules[0], null, 2))
    console.log('\nAvailable columns:', Object.keys(schedules[0]))
  } else {
    console.log('No schedules found')
  }
}

checkSample()
