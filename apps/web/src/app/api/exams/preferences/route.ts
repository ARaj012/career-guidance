import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const preferencesSchema = z.object({
  examId: z.string().uuid(),
  notifyRegistrationStart: z.boolean().optional(),
  notifyRegistrationEnd: z.boolean().optional(),
  notifyAdmitCard: z.boolean().optional(),
  notifyExamDate: z.boolean().optional(),
  notifyAnswerKey: z.boolean().optional(),
  notifyResult: z.boolean().optional(),
  notifyDateChanges: z.boolean().optional(),
  notifyGeneralUpdates: z.boolean().optional(),
  countdownReminders: z.boolean().optional(),
  countdownDays: z.array(z.number().int().min(0)).optional(),
  isTrackingEnabled: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')

    let query = supabase
      .from('user_exam_tracking_preferences')
      .select('*')
      .eq('user_id', user.id)

    if (examId) {
      query = query.eq('exam_id', examId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data || [] })
  } catch (error) {
    console.error('Error in preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = preferencesSchema.parse(body)

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required', requiresSubscription: true },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('user_exam_tracking_preferences')
      .upsert({
        user_id: user.id,
        exam_id: validatedData.examId,
        notify_registration_start: validatedData.notifyRegistrationStart,
        notify_registration_end: validatedData.notifyRegistrationEnd,
        notify_admit_card: validatedData.notifyAdmitCard,
        notify_exam_date: validatedData.notifyExamDate,
        notify_answer_key: validatedData.notifyAnswerKey,
        notify_result: validatedData.notifyResult,
        notify_date_changes: validatedData.notifyDateChanges,
        notify_general_updates: validatedData.notifyGeneralUpdates,
        countdown_reminders: validatedData.countdownReminders,
        countdown_days: validatedData.countdownDays,
        is_tracking_enabled: validatedData.isTrackingEnabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,exam_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }
    console.error('Error in preferences:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
