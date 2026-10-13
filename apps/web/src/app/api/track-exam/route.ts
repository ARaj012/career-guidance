import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 POST /api/track-exam called')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('👤 User:', user?.id)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()

    console.log('💳 Subscription:', subscription?.status)

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required to track exams', requiresSubscription: true },
        { status: 403 }
      )
    }

    const body = await req.json()
    console.log('📦 Request body:', body)
    const { examId, examSlug, trackingType } = body

    // Use slug to find the exam - more reliable than ID
    console.log('🔍 Looking up exam by slug:', examSlug)
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id')
      .eq('slug', examSlug)
      .maybeSingle()

    if (examError || !exam) {
      console.error('❌ Exam not found by slug:', examSlug, examError)
      return NextResponse.json({ error: 'Exam not found', details: examError?.message }, { status: 404 })
    }

    console.log('✅ Exam found by slug:', examSlug, 'with ID:', exam.id)
    
    // Track the exam and store the slug for reliable lookup
    console.log('🔍 Tracking exam for user:', user.id, 'exam:', exam.id, 'type:', trackingType)
    const { data: trackedExam, error } = await supabase
      .from('user_saved_exams')
      .upsert({
        user_id: user.id,
        exam_id: exam.id,
        exam_slug: examSlug, // Store slug for reliable lookup
        tracking_type: trackingType,
        current_status: 'interested',
        status_updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,exam_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error tracking exam:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to track exam', details: error.message }, { status: 500 })
    }

    console.log('✅ Exam tracked successfully:', trackedExam)

    return NextResponse.json({ 
      success: true,
      trackedExam,
      examId: exam.id
    })
  } catch (error) {
    console.error('❌ Error in track exam:', error)
    return NextResponse.json({ error: 'Failed to track exam', details: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ DELETE /api/track-exam called')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'examId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_saved_exams')
      .delete()
      .eq('user_id', user.id)
      .eq('exam_id', examId)

    if (error) {
      console.error('❌ Error untracking exam:', error)
      return NextResponse.json({ error: 'Failed to untrack exam' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in untrack exam:', error)
    return NextResponse.json({ error: 'Failed to untrack exam' }, { status: 500 })
  }
}
