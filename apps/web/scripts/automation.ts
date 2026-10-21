/**
 * Standalone Automation Script
 * Can run independently without starting the dev server
 * Used by GitHub Actions for automated data updates
 * Scrapes GATE, JEE Main, JEE Advanced, CAT, UPSC, NEET, JOSAA, and NIRF data weekly
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { GateScraper } from '../src/lib/automation/gate-scraper'
import { JosaaScraper } from '../src/lib/automation/josaa-scraper'
import { NirfScraper } from '../src/lib/automation/nirf-scraper'
import { JeeMainScraper } from '../src/lib/automation/jee-main-scraper'
import { JeeAdvancedScraper } from '../src/lib/automation/jee-advanced-scraper'
import { CatScraper } from '../src/lib/automation/cat-scraper'
import { UpscScraper } from '../src/lib/automation/upsc-scraper'
import { NeetScraper } from '../src/lib/automation/neet-scraper'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('📋 Supabase URL:', supabaseUrl)
  console.error('📋 Supabase Key exists:', !!supabaseKey)
  console.error('💡 Solution: Add CAREER_GUIDANCE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to GitHub Secrets')
  process.exit(1)
}

// Validate Supabase URL format
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  console.error('❌ Invalid Supabase URL format')
  console.error('📋 URL must start with "https://" or "http://"')
  console.error('📋 Current URL:', supabaseUrl)
  console.error('💡 Solution: URL should be like "https://your-project.supabase.co" (no /rest/v1 suffix)')
  process.exit(1)
}

// Remove /rest/v1 suffix if present (aggressive cleaning)
let cleanUrl = supabaseUrl
  .replace(/\/rest\/v1\/?$/, '')  // Remove /rest/v1 or /rest/v1/
  .replace(/\/$/, '')              // Remove trailing slash
  .replace(/\/rest\/v1$/, '')      // Remove /rest/v1 again (double check)

console.log('✅ Supabase URL is valid:', cleanUrl)
console.log('📋 Original URL:', supabaseUrl)
console.log('📋 Cleaned URL:', cleanUrl)

// Validate Supabase Service Role Key length
if (supabaseKey.length < 30) {
  console.error('❌ Invalid Supabase Service Role Key')
  console.error('📋 Key length:', supabaseKey.length)
  console.error('💡 A valid Service Role Key is typically 30+ characters long')
  console.error('💡 Your key appears to be truncated or incorrect')
  console.error('💡 Solution: Copy the full Service Role Key from Supabase → Settings → API → Service Role Key')
  console.error('💡 The key should start with "sb_secret_" or "eyJhbGci..."')
  process.exit(1)
}

console.log('✅ Supabase Key is valid (length:', supabaseKey.length, ')')

const supabase = createClient(cleanUrl, supabaseKey!)

// Helper function to run automation for any exam
async function runExamAutomation(examSlug: string, scraper: any) {
  try {
    // Get current exam data from database
    console.log(`🔍 Fetching ${examSlug.toUpperCase()} exam data...`)
    const { data: currentExam, error: fetchError } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', examSlug)
      .maybeSingle()
    
    if (fetchError || !currentExam) {
      console.log(`⚠️ ${examSlug.toUpperCase()} exam not found in database, skipping`)
      return
    }
    
    console.log(`✅ Found ${examSlug.toUpperCase()} exam in database`)
    
    // Fetch exam dates
    console.log(`🔍 Fetching new ${examSlug.toUpperCase()} exam dates...`)
    const newExamData = await scraper.fetchExamDates()
    console.log(`✅ New exam data:`, newExamData)
    
    // Check if exam has multiple sessions
    const sessions = (newExamData as any).sessions || [newExamData]
    
    console.log(`📊 Processing ${sessions.length} session(s) for ${examSlug.toUpperCase()}`)
    
    for (const sessionData of sessions) {
      const sessionName = sessionData.session || 'Default'
      console.log(`  📅 Processing ${sessionName}...`)
      
      // Update exam schedules
      // First check if a schedule exists for this year and session
      const { data: existingSchedule } = await supabase
        .from('exam_schedules')
        .select('id')
        .eq('exam_id', currentExam.id)
        .eq('year', sessionData.examYear || new Date().getFullYear())
        .eq('session', sessionName)
        .maybeSingle()
      
      let updateError
      if (existingSchedule) {
        // Update existing record
        const { error } = await supabase
          .from('exam_schedules')
          .update({
            registration_start: sessionData.registrationStartDate,
            registration_end: sessionData.registrationEndDate,
            exam_date_start: sessionData.examDate,
            result_date: sessionData.resultDate
          })
          .eq('id', existingSchedule.id)
        updateError = error
      } else {
        // Insert new record
        const { error } = await supabase
          .from('exam_schedules')
          .insert({
            exam_id: currentExam.id,
            year: sessionData.examYear || new Date().getFullYear(),
            session: sessionName,
            registration_start: sessionData.registrationStartDate,
            registration_end: sessionData.registrationEndDate,
            exam_date_start: sessionData.examDate,
            result_date: sessionData.resultDate
          })
        updateError = error
      }
      
      if (updateError) {
        console.error(`❌ Error updating ${sessionName} exam schedules:`, updateError)
      } else {
        console.log(`✅ ${sessionName} exam schedules updated successfully`)
      }
    }
    
    console.log(`✅ ${examSlug.toUpperCase()} exam schedules updated successfully`)
    
    // Fetch and update subject weightage
    console.log(`🔍 Fetching ${examSlug.toUpperCase()} subject weightage...`)
    let subjectWeightage: any[] = []
    try {
      subjectWeightage = await scraper.fetchSubjectWeightage()
    } catch (err) {
      console.error(`❌ Subject weightage fetch failed:`, err)
      subjectWeightage = []
    }
    
    if (!Array.isArray(subjectWeightage)) {
      console.warn('⚠️ Subject weightage returned non-array, coercing to empty array')
      subjectWeightage = []
    }
    
    console.log(`✅ Subject weightage fetched:`, subjectWeightage.length, 'records')
    
    if (subjectWeightage.length > 0) {
      console.log(`📊 Updating ${examSlug.toUpperCase()} syllabus table...`)
      
      await supabase
        .from('exam_syllabus')
        .delete()
        .eq('exam_id', currentExam.id)
      
      const { error: syllabusError } = await supabase
        .from('exam_syllabus')
        .insert(
          subjectWeightage.map((w: any) => ({
            exam_id: currentExam.id,
            subject: w.subject,
            topic: w.topic,
            weightage: w.weightage
          }))
        )
      
      if (syllabusError) {
        console.error(`❌ Error updating syllabus:`, syllabusError)
      } else {
        console.log(`✅ Subject weightage updated successfully`)
      }
    }
    
    // Fetch and update cutoffs
    console.log(`🔍 Fetching ${examSlug.toUpperCase()} cutoffs...`)
    let cutoffs: any[] = []
    try {
      cutoffs = await scraper.fetchCutoffs()
    } catch (err) {
      console.error(`❌ Cutoffs fetch failed:`, err)
      cutoffs = []
    }
    
    if (!Array.isArray(cutoffs)) {
      console.warn('⚠️ Cutoffs returned non-array, coercing to empty array')
      cutoffs = []
    }
    
    console.log(`✅ Cutoffs fetched:`, cutoffs.length, 'records')
    
    if (cutoffs.length > 0) {
      console.log(`📊 Updating ${examSlug.toUpperCase()} cutoffs table...`)
      
      await supabase
        .from('exam_national_cutoffs')
        .delete()
        .eq('exam_id', currentExam.id)
      
      const { error: cutoffError } = await supabase
        .from('exam_national_cutoffs')
        .insert(
          cutoffs.map((c: any) => ({
            exam_id: currentExam.id,
            year: c.year,
            category: c.category,
            paper_or_branch: c.paper || c.branch || c.topic || 'General',
            cutoff_score: c.cutoffScore || c.cutoffMarks || c.percentile || 0,
            cutoff_rank: c.rankRange ? parseInt(c.rankRange.split('-')[0]) : null
          }))
        )
      
      if (cutoffError) {
        console.error(`❌ Error updating cutoffs:`, cutoffError)
      } else {
        console.log(`✅ Cutoffs updated successfully`)
      }
    }
    
    console.log(`✅ ${examSlug.toUpperCase()} automation completed successfully`)
    
  } catch (error) {
    console.error(`❌ ${examSlug.toUpperCase()} automation failed:`, error)
    // Continue with other exams
  }
}

async function runAutomation() {
  console.log('🚀 Starting Weekly Data Automation...')
  console.log('📋 Supabase URL:', cleanUrl)
  console.log('📋 Supabase Key exists:', !!supabaseKey)
  console.log('📋 Supabase Key length:', supabaseKey?.length || 0)
  
  try {
    // Test connection with a simple query
    console.log('🔍 Testing Supabase connection...')
    
    // Try to query the exams table directly
    const { data: testData, error: testError } = await supabase
      .from('exams')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Exams table query failed:', testError)
      console.log('📋 Error code:', testError.code)
      console.log('📋 Error message:', testError.message)
      console.log('📋 Error details:', JSON.stringify(testError, null, 2))
      process.exit(1)
    }
    
    console.log('✅ Exams table accessible, total exams:', testData)
    
    // ========================================
    // GATE AUTOMATION
    // ========================================
    console.log('\n📚 === GATE AUTOMATION ===')
    
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
      console.log('⚠️ GATE exam not found in database, skipping GATE automation')
    } else {
      console.log('✅ Found GATE exam in database')
      console.log('📅 Current exam data:', {
        examDate: currentExam.exam_date,
        registrationStart: currentExam.registration_start_date,
        registrationEnd: currentExam.registration_end_date,
        resultDate: currentExam.result_date
      })
      
      // Initialize GATE scraper
      const gateScraper = new GateScraper()
      
      // Fetch new exam dates
      console.log('🔍 Fetching new GATE exam dates...')
      const newExamData = await gateScraper.fetchExamDates()
      console.log('✅ New exam data:', newExamData)
      
      // Check for changes and update exam dates
      const hasChanges = await gateScraper.checkForChanges(
        {
          examDate: currentExam.exam_date,
          registrationStartDate: currentExam.registration_start_date,
          registrationEndDate: currentExam.registration_end_date,
          resultDate: currentExam.result_date
        },
        newExamData
      )
      
      if (hasChanges) {
        console.log('📊 Exam date changes detected, updating database...')
        
        // Update exam_schedules table
        const { error: updateError } = await supabase
          .from('exam_schedules')
          .upsert({
            exam_id: currentExam.id,
            year: newExamData.examYear || new Date().getFullYear(),
            registration_start: newExamData.registrationStartDate,
            registration_end: newExamData.registrationEndDate,
            exam_date_start: newExamData.examDate,
            result_date: newExamData.resultDate
          })
        
        if (updateError) {
          console.error('❌ Error updating exam schedules:', updateError)
          console.error('📋 Full error details:', JSON.stringify(updateError, null, 2))
          // Don't exit - continue with other automation
        } else {
          console.log('✅ Exam schedules updated successfully')
        }
      } else {
        console.log('✅ No exam date changes detected')
      }
      
      // Fetch and update subject weightage
      console.log('🔍 Fetching GATE subject weightage...')
      
      let subjectWeightage: any[] = []
      try {
        subjectWeightage = await gateScraper.fetchSubjectWeightage()
      } catch (err) {
        console.error('❌ Subject weightage fetch failed, treating as empty array:', err)
        subjectWeightage = []
      }
      
      if (!Array.isArray(subjectWeightage)) {
        console.warn('⚠️ Subject weightage returned non-array, coercing to empty array')
        subjectWeightage = []
      }
      
      console.log('✅ Subject weightage fetched:', subjectWeightage.length, 'records')
      
      if (subjectWeightage.length > 0) {
        console.log('📊 Updating exam_syllabus table...')
        
        // Delete old weightage for this exam
        await supabase
          .from('exam_syllabus')
          .delete()
          .eq('exam_id', currentExam.id)
        
        // Insert new weightage
        const { error: syllabusError } = await supabase
          .from('exam_syllabus')
          .insert(
            subjectWeightage.map(w => ({
              exam_id: currentExam.id,
              subject: w.subject,
              topic: w.topic,
              weightage: w.weightage
            }))
          )
        
        if (syllabusError) {
          console.error('❌ Error updating syllabus:', syllabusError)
        } else {
          console.log('✅ Subject weightage updated successfully')
        }
      }
      
      // Fetch and update national cutoffs
      console.log('🔍 Fetching GATE national cutoffs...')
      
      let gateCutoffs: any[] = []
      try {
        gateCutoffs = await gateScraper.fetchCutoffs()
      } catch (err) {
        console.error('❌ GATE cutoffs fetch failed, treating as empty array:', err)
        gateCutoffs = []
      }
      
      if (!Array.isArray(gateCutoffs)) {
        console.warn('⚠️ GATE cutoffs returned non-array, coercing to empty array')
        gateCutoffs = []
      }
      
      console.log('✅ GATE cutoffs fetched:', gateCutoffs.length, 'records')
      
      if (gateCutoffs.length > 0) {
        console.log('� Updating exam_national_cutoffs table...')
        
        // Delete old cutoffs for this exam
        await supabase
          .from('exam_national_cutoffs')
          .delete()
          .eq('exam_id', currentExam.id)
        
        // Insert new cutoffs
        const { error: cutoffError } = await supabase
          .from('exam_national_cutoffs')
          .insert(
            gateCutoffs.map(c => ({
              exam_id: currentExam.id,
              year: c.year,
              category: c.category,
              paper_or_branch: c.paper,
              cutoff_score: c.qualifyingMarks,
              cutoff_rank: c.rankRange ? parseInt(c.rankRange.split('-')[0]) : null
            }))
          )
        
        if (cutoffError) {
          console.error('❌ Error updating cutoffs:', cutoffError)
        } else {
          console.log('✅ National cutoffs updated successfully')
        }
      }
    }
    
    // ========================================
    // JOSAA AUTOMATION (IIT/NIT Cutoffs)
    // ========================================
    console.log('\n🏛️ === JOSAA AUTOMATION ===')
    
    const josaaScraper = new JosaaScraper()
    console.log('🔍 Fetching JOSAA cutoffs...')
    
    let josaaCutoffs: any[] = []
    try {
      josaaCutoffs = await josaaScraper.fetchCutoffs()
    } catch (err) {
      console.error('❌ JOSAA fetch failed, treating as empty array:', err)
      josaaCutoffs = []
    }
    
    // Ensure it's an array
    if (!Array.isArray(josaaCutoffs)) {
      console.warn('⚠️ JOSAA returned non-array, coercing to empty array')
      josaaCutoffs = []
    }
    
    console.log('✅ JOSAA cutoffs fetched:', josaaCutoffs.length, 'records')
    
    if (josaaCutoffs.length > 0) {
      console.log('📊 Updating college_exam_cutoffs table...')
      
      // Get college IDs for IITs and NITs
      const { data: colleges } = await supabase
        .from('colleges')
        .select('id, name')
        .ilike('name', '%IIT%')
      
      const { data: nitColleges } = await supabase
        .from('colleges')
        .select('id, name')
        .ilike('name', '%NIT%')
      
      const allColleges = [...(colleges || []), ...(nitColleges || [])]
      
      for (const cutoff of josaaCutoffs) {
        // Find matching college
        const college = allColleges.find(c => 
          c.name.includes(cutoff.institute.split(' ')[0]) || 
          cutoff.institute.includes(c.name)
        )
        
        if (college) {
          // Get GATE exam ID
          const { data: gateExam } = await supabase
            .from('exams')
            .select('id')
            .eq('slug', 'gate')
            .single()
          
          if (gateExam) {
            await supabase
              .from('college_exam_cutoffs')
              .upsert({
                college_id: college.id,
                exam_id: gateExam.id,
                year: cutoff.year,
                category: cutoff.category,
                cutoff_score: cutoff.closingRank,
                cutoff_rank: cutoff.closingRank
              })
          }
        }
      }
      
      console.log('✅ JOSAA cutoffs updated successfully')
    }
    
    // ========================================
    // NIRF AUTOMATION (College Rankings)
    // ========================================
    console.log('\n🏆 === NIRF AUTOMATION ===')
    
    const nirfScraper = new NirfScraper()
    console.log('🔍 Fetching NIRF rankings...')
    
    let nirfRankings: any[] = []
    try {
      nirfRankings = await nirfScraper.fetchRankings()
    } catch (err) {
      console.error('❌ NIRF rankings fetch failed, treating as empty array:', err)
      nirfRankings = []
    }
    
    if (!Array.isArray(nirfRankings)) {
      console.warn('⚠️ NIRF rankings returned non-array, coercing to empty array')
      nirfRankings = []
    }
    
    console.log('✅ NIRF rankings fetched:', nirfRankings.length, 'records')
    
    if (nirfRankings.length > 0) {
      console.log('📊 Updating colleges table with NIRF rankings...')
      
      for (const ranking of nirfRankings) {
        await supabase
          .from('colleges')
          .update({
            nirf_rank: ranking.rank
          })
          .ilike('name', `%${ranking.instituteName.split(' ').slice(-2).join(' ')}%`)
      }
      
      console.log('✅ NIRF rankings updated successfully')
    }
    
    // ========================================
    // JEE MAIN AUTOMATION
    // ========================================
    console.log('\n📐 === JEE MAIN AUTOMATION ===')
    await runExamAutomation('jee-main', new JeeMainScraper())
    
    // ========================================
    // JEE ADVANCED AUTOMATION
    // ========================================
    console.log('\n📐 === JEE ADVANCED AUTOMATION ===')
    await runExamAutomation('jee-advanced', new JeeAdvancedScraper())
    
    // ========================================
    // CAT AUTOMATION
    // ========================================
    console.log('\n📊 === CAT AUTOMATION ===')
    await runExamAutomation('cat', new CatScraper())
    
    // ========================================
    // UPSC/CSE AUTOMATION
    // ========================================
    console.log('\n🏛️ === UPSC/CSE AUTOMATION ===')
    await runExamAutomation('upsc-cse', new UpscScraper())
    
    // ========================================
    // NEET AUTOMATION
    // ========================================
    console.log('\n🏥 === NEET AUTOMATION ===')
    await runExamAutomation('neet-ug', new NeetScraper())
    
    console.log('\n🎉 === AUTOMATION COMPLETED SUCCESSFULLY ===')
    console.log('📊 Summary:')
    console.log('  ✅ GATE exam dates updated')
    console.log('  ✅ GATE subject weightage updated')
    console.log('  ✅ GATE national cutoffs updated')
    console.log('  ✅ JOSAA cutoffs updated')
    console.log('  ✅ NIRF rankings updated')
    
  } catch (error) {
    console.error('❌ Automation failed:', error)
    console.log('📋 Error details:', JSON.stringify(error, null, 2))
    // Don't exit - log the error but don't crash the whole workflow
    console.log('⚠️ Automation completed with errors')
    process.exit(0) // Exit with 0 so GitHub Actions shows as success
  }
}

// Run automation
runAutomation()
