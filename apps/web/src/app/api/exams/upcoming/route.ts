import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get tracked exams with upcoming important dates
    const { data, error } = await supabase
      .from('user_saved_exams')
      .select(`
        *,
        exams (
          id,
          title,
          slug,
          conducting_body,
          exam_schedules (
            registration_start,
            registration_end,
            exam_date_start,
            result_date,
            year
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('tracking_type', 'definitely_giving')
      .order('priority', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming exams:', error)
      return NextResponse.json({ error: 'Failed to fetch upcoming exams' }, { status: 500 })
    }

    // Calculate days remaining for each exam
    const upcomingExams = (data || []).map((item: any) => {
      const exam = item.exams
      const schedule = exam?.exam_schedules?.[0]
      const examDate = schedule?.exam_date_start
      
      let daysRemaining = null
      let nextImportantDate = null
      let nextImportantDateType = null

      if (examDate) {
        const now = new Date()
        const examDateObj = new Date(examDate)
        daysRemaining = Math.ceil((examDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Find next important date
      if (schedule) {
        const dates = [
          { type: 'registration_end', date: schedule.registration_end },
          { type: 'exam_date', date: schedule.exam_date_start },
          { type: 'result_date', date: schedule.result_date },
        ]
        
        const now = new Date()
        for (const d of dates) {
          if (d.date && new Date(d.date) > now) {
            if (!nextImportantDate || new Date(d.date) < new Date(nextImportantDate)) {
              nextImportantDate = d.date
              nextImportantDateType = d.type
            }
          }
        }
      }

      return {
        ...item,
        daysRemaining,
        nextImportantDate,
        nextImportantDateType,
      }
    })

    // Sort by days remaining (nearest first)
    upcomingExams.sort((a: any, b: any) => {
      if (a.daysRemaining === null) return 1
      if (b.daysRemaining === null) return -1
      return a.daysRemaining - b.daysRemaining
    })

    return NextResponse.json({ upcomingExams })
  } catch (error) {
    console.error('Error in upcoming exams:', error)
    return NextResponse.json({ error: 'Failed to fetch upcoming exams' }, { status: 500 })
  }
}
