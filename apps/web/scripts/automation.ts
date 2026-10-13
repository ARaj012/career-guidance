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
  
  try {
    // Get current GATE data from database
    const { data: currentExam, error: fetchError } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', 'gate')
      .single()
    
    if (fetchError || !currentExam) {
      console.error('❌ Error fetching current exam data:', fetchError)
      process.exit(1)
    }
    
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
    process.exit(1)
  }
}

// Run automation
runAutomation()
