import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { gateScraper } from '@/lib/automation/gate-scraper'

/**
 * GATE Automation API Endpoint
 * Triggers automated data scraping and database updates
 * Can be called manually or scheduled (cron job)
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    
    // Validate action
    if (!action || !['exam-dates', 'cutoffs', 'all'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be: exam-dates, cutoffs, or all' }, { status: 400 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get current GATE data from database
    const { data: currentExam } = await supabase
      .from('exams')
      .select('*')
      .eq('slug', 'gate')
      .single()
    
    if (!currentExam) {
      return NextResponse.json({ error: 'GATE exam not found in database' }, { status: 404 })
    }
    
    console.log('🚀 Starting GATE automation for action:', action)
    console.log('📅 Current exam data:', {
      examDate: currentExam.exam_date,
      registrationStart: currentExam.registration_start_date,
      registrationEnd: currentExam.registration_end_date,
      resultDate: currentExam.result_date
    })
    
    let changes = []
    let results = {}
    
    if (action === 'exam-dates' || action === 'all') {
      console.log('📅 Fetching exam dates...')
      try {
        const newExamData = await gateScraper.fetchExamDates()
        results['examDates'] = newExamData
        
        // Check for changes
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
            console.error('❌ Error updating exam dates:', updateError)
            return NextResponse.json({ error: 'Failed to update exam dates' }, { status: 500 })
          }
          
          changes.push('exam-dates')
          console.log('✅ Exam dates updated successfully')
        } else {
          console.log('✅ No changes in exam dates')
        }
      } catch (error) {
        console.error('❌ Error fetching exam dates:', error)
        results['examDatesError'] = error.message
      }
    }
    
    if (action === 'cutoffs' || action === 'all') {
      console.log('📊 Fetching cutoffs...')
      try {
        const newCutoffData = await gateScraper.fetchCutoffs()
        results['cutoffs'] = newCutoffData
        
        // TODO: Store cutoffs in separate table (exam_cutoffs)
        // For now, just log the data
        console.log('📊 New cutoff data:', newCutoffData)
        changes.push('cutoffs')
      } catch (error) {
        console.error('❌ Error fetching cutoffs:', error)
        results['cutoffsError'] = error.message
      }
    }
    
    // Create notification for changes
    if (changes.length > 0) {
      await createAutomationNotification(supabase, 'GATE', changes)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'GATE automation completed successfully',
      changes: changes,
      results: results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ GATE automation error:', error)
    return NextResponse.json({ 
      error: 'Automation failed',
      message: error.message 
    }, { status: 500 })
  }
}

async function createAutomationNotification(supabase: any, exam: string, changes: string[]) {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        title: `${exam} Data Updated`,
        message: `Automated update completed. Changes: ${changes.join(', ')}`,
        type: 'automation',
        priority: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('❌ Error creating notification:', error)
    }
  } catch (error) {
    console.error('❌ Error in notification creation:', error)
  }
}
