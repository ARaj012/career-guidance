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

async function findNeetSlug() {
  console.log('🔍 Searching for NEET exam in database...\n')
  
  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, name, slug')
    .ilike('name', '%neet%')
  
  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  
  if (exams && exams.length > 0) {
    console.log('Found NEET exams:')
    exams.forEach(exam => {
      console.log(`  - Name: ${exam.name}`)
      console.log(`    Slug: ${exam.slug}`)
      console.log(`    ID: ${exam.id}`)
    })
  } else {
    console.log('❌ No NEET exam found in database')
  }
}

findNeetSlug()
