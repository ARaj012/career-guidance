/**
 * Standalone Automation Script
 * Can run independently without starting the dev server
 * Used by GitHub Actions for automated data updates
 */

import { createClient } from '@supabase/supabase-js'
import { GateScraper } from '../src/lib/automation/gate-scraper'

// Load environment variables
const supabaseUrl = process.env.CAREER_GUIDANCE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runAutomation() {
  console.log('🚀 Starting GATE Automation...')
  console.log('📋 Supabase URL:', supabaseUrl)
  console.log('📋 Supabase Key exists:', !!supabaseKey)
  
  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('exams')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Connection test failed:', testError)
      console.log('📋 Error details:', JSON.stringify(testError, null, 2))
      process.exit(1)
    }
    
    console.log('✅ Connection successful, total exams:', testData)
    
    // Get current GATE data from database
    console.log('🔍 Fetching GATE exam data...')
    const { data: currentExam, error: fetchError } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', 'gate')
      .maybeSingle()
    
    if (fetchError) {
      console.error('❌ Error fetching current exam data:', fetchError)
      console.log('📋 Error details:', JSON.stringify(fetchError, null, 2))
      process.exit(1)
    }
    
    if (!currentExam) {
      console.log('⚠️ GATE exam not found in database')
      console.log('📋 This might mean:')
      console.log('   - The exams table does not exist')
      console.log('   - The GATE exam record does not exist')
      console.log('   - The slug column name is different')
      console.log('🔍 Checking database structure...')
      
      // Try to check if table exists
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      console.log('📋 Available tables:', tables?.map(t => t.table_name) || 'none')
      
      process.exit(1)
    }
    
    console.log('✅ Found GATE exam in database')
    console.log('📅 Current exam data:', {
      examDate: currentExam.exam_date,
      registrationStart: currentExam.registration_start_date,
      registrationEnd: currentExam.registration_end_date,
      resultDate: currentExam.result_date
    })
    
    // Initialize scraper
    const scraper = new GateScraper()
    
    // Fetch new data
    console.log('🔍 Fetching new exam dates...')
    const newExamData = await scraper.fetchExamDates()
    console.log('✅ New exam data:', newExamData)
    
    // Check for changes
    const hasChanges = await scraper.checkForChanges(
      {
        examDate: currentExam.exam_date,
        registrationStartDate: currentExam.registration_start_date,
        registrationEndDate: currentExam.registration_end_date,
        resultDate: currentExam.result_date
      },
      newExamData
    )
    
    if (hasChanges) {
      console.log('📊 Changes detected, updating database...')
      
      // Update database
      const { error: updateError } = await supabase
        .from('exams')
        .update({
          exam_date: newExamData.examDate,
          registration_start_date: newExamData.registrationStartDate,
          registration_end_date: newExamData.registrationEndDate,
          result_date: newExamData.resultDate,
          updated_at: new Date().toISOString()
        })
        .eq('slug', 'gate')
      
      if (updateError) {
        console.error('❌ Error updating database:', updateError)
        console.log('📋 Error details:', JSON.stringify(updateError, null, 2))
        process.exit(1)
      }
      
      console.log('✅ Database updated successfully')
    } else {
      console.log('✅ No changes detected')
    }
    
    // Fetch cutoffs
    console.log('🔍 Fetching cutoffs...')
    const newCutoffData = await scraper.fetchCutoffs()
    console.log('✅ Cutoff data fetched:', newCutoffData.length, 'records')
    
    console.log('🎉 Automation completed successfully!')
    
  } catch (error) {
    console.error('❌ Automation failed:', error)
    console.log('📋 Error details:', JSON.stringify(error, null, 2))
    process.exit(1)
  }
}

// Run automation
runAutomation()
