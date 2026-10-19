import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExamSlugs() {
  console.log('🔍 Checking exam slugs in database...\n')
  
  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, name, slug')
    .order('name')
  
  if (error) {
    console.error('Error fetching exams:', error)
    process.exit(1)
  }
  
  console.log('Available exams:')
  console.log('==================')
  exams?.forEach(exam => {
    console.log(`Name: ${exam.name}`)
    console.log(`Slug: ${exam.slug}`)
    console.log(`ID: ${exam.id}`)
    console.log('---')
  })
  
  // Check for specific exams
  const targetExams = ['JEE Main', 'JEE Advanced', 'CAT', 'UPSC', 'NEET', 'GATE']
  console.log('\n🎯 Target exams:')
  console.log('==================')
  targetExams.forEach(target => {
    const found = exams?.find(e => e.name.toLowerCase().includes(target.toLowerCase()))
    if (found) {
      console.log(`✅ ${target}: slug = "${found.slug}"`)
    } else {
      console.log(`❌ ${target}: NOT FOUND in database`)
    }
  })
}

checkExamSlugs()
