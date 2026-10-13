import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get all exams
    const { data: exams } = await supabase
      .from('exams')
      .select('id, title, slug')
      .limit(10)
    
    // Get user's tracked exams
    const { data: { user } } = await supabase.auth.getUser()
    const { data: trackedExams } = await supabase
      .from('user_saved_exams')
      .select('*')
      .eq('user_id', user?.id)
    
    return NextResponse.json({ 
      exams: exams || [],
      trackedExams: trackedExams || [],
      userId: user?.id
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
