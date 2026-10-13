import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    console.log('🧹 Cleaning up bad tracking data (GET)')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Delete all tracked exams for this user
    const { error } = await supabase
      .from('user_saved_exams')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Error cleaning up:', error)
      return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
    }

    console.log('✅ Cleanup successful')
    return NextResponse.json({ success: true, message: 'All tracked exams deleted' })
  } catch (error) {
    console.error('❌ Error in cleanup:', error)
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('🧹 Cleaning up bad tracking data (DELETE)')
    
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Delete all tracked exams for this user
    const { error } = await supabase
      .from('user_saved_exams')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Error cleaning up:', error)
      return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
    }

    console.log('✅ Cleanup successful')
    return NextResponse.json({ success: true, message: 'All tracked exams deleted' })
  } catch (error) {
    console.error('❌ Error in cleanup:', error)
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
  }
}
