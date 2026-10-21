import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkStructure() {
  console.log('🔍 Checking exam_schedules table structure...\n')
  
  // Get column info
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'exam_schedules' })
  
  if (error) {
    console.log('Error fetching columns, trying alternative method...')
    
    // Alternative: try to describe the table
    const { data: sample } = await supabase
      .from('exam_schedules')
      .select('*')
      .limit(1)
    
    if (sample && sample.length > 0) {
      console.log('Sample record:')
      console.log(JSON.stringify(sample[0], null, 2))
      console.log('\nAvailable columns:', Object.keys(sample[0]))
    }
  } else {
    console.log('Columns:', columns)
  }
}

checkStructure()
