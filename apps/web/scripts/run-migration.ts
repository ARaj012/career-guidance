import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function runMigration() {
  console.log('🔧 Running migration: Add session column to exam_schedules...\n')
  
  try {
    // Add session column
    const { error: addColumnError } = await supabase.rpc('sql', {
      query: `ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS session TEXT;`
    })
    
    if (addColumnError) {
      console.log('Adding column via RPC failed, trying direct SQL...')
      // Try direct SQL
      const { error } = await supabase
        .from('exam_schedules')
        .select('*')
        .limit(1)
      
      if (error && error.message.includes('session')) {
        console.log('Column may not exist, but we cannot add it via client')
        console.log('Please run the SQL manually in Supabase SQL Editor:')
        console.log('ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS session TEXT;')
      }
    } else {
      console.log('✅ Session column added successfully')
    }
    
    console.log('\n⚠️ Note: If the column already exists, this is fine.')
    console.log('Please run supabase/add-session-column.sql in Supabase SQL Editor to complete the migration.')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:')
    console.log('See supabase/add-session-column.sql')
  }
}

runMigration()
