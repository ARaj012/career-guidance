import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 GET /api/exams/my-exams called')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('👤 User:', user?.id)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const trackingType = searchParams.get('trackingType')
    const status = searchParams.get('status')

    console.log('🔍 Filters:', { trackingType, status })

    // Get tracked exams
    let query = supabase
      .from('user_saved_exams')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (trackingType) {
      query = query.eq('tracking_type', trackingType)
    }

    if (status) {
      query = query.eq('current_status', status)
    }

    const { data: trackedExams, error } = await query

    if (error) {
      console.error('❌ Error fetching tracked exams:', error)
      return NextResponse.json({ error: 'Failed to fetch tracked exams', details: error.message }, { status: 500 })
    }

    console.log('✅ Tracked exams fetched:', trackedExams?.length || 0)
    console.log('📦 Tracked exams data:', JSON.stringify(trackedExams, null, 2))

    // For each tracked exam, get exam details using the stored slug
    const trackedExamsWithDetails = await Promise.all(
      (trackedExams || []).map(async (trackedExam) => {
        try {
          console.log('🔍 Processing tracked exam:', trackedExam.exam_id, 'slug:', trackedExam.exam_slug)
          
          // Try to get exam by slug first (more reliable)
          if (trackedExam.exam_slug) {
            const { data: exam } = await supabase
              .from('exams')
              .select('*')
              .eq('slug', trackedExam.exam_slug)
              .maybeSingle()
            
            if (exam) {
              console.log('✅ Exam found by slug:', trackedExam.exam_slug)
              return {
                ...trackedExam,
                exam: exam
              }
            }
          }
          
          // Fallback: try by ID
          const { data: exam } = await supabase
            .from('exams')
            .select('*')
            .eq('id', trackedExam.exam_id)
            .maybeSingle()
          
          if (exam) {
            console.log('✅ Exam found by ID:', trackedExam.exam_id)
            return {
              ...trackedExam,
              exam: exam
            }
          }
          
          // If still not found, create basic fallback
          console.log('⚠️ Exam not found, using fallback')
          const fallbackExam = {
            id: trackedExam.exam_id,
            title: trackedExam.exam_slug || `Tracked Exam (${trackedExam.exam_id.substring(0, 8)}...)`,
            slug: trackedExam.exam_slug || 'exams',
            conducting_body: 'Details not available',
            exam_level: 'N/A',
            mode: 'N/A',
            exam_schedules: []
          }
          
          return {
            ...trackedExam,
            exam: fallbackExam
          }
        } catch (examError) {
          console.log('⚠️ Error fetching exam details:', examError)
          const fallbackExam = {
            id: trackedExam.exam_id,
            title: trackedExam.exam_slug || `Tracked Exam (${trackedExam.exam_id.substring(0, 8)}...)`,
            slug: trackedExam.exam_slug || 'exams',
            conducting_body: 'Details not available',
            exam_level: 'N/A',
            mode: 'N/A',
            exam_schedules: []
          }
          
          return {
            ...trackedExam,
            exam: fallbackExam
          }
        }
      })
    )

    console.log('📦 Final tracked exams with details:', JSON.stringify(trackedExamsWithDetails, null, 2))

    return NextResponse.json({ trackedExams: trackedExamsWithDetails || [] })
  } catch (error) {
    console.error('❌ Error in my exams:', error)
    return NextResponse.json({ error: 'Failed to fetch tracked exams', details: String(error) }, { status: 500 })
  }
}
