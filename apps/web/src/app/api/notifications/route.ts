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
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({ 
      notifications: data || [],
      unreadCount: unreadCount || 0
    })
  } catch (error) {
    console.error('Error in notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAsRead } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'notificationIds array is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_notifications')
      .update({ 
        is_read: markAsRead !== false 
      })
      .eq('user_id', user.id)
      .in('id', notificationIds)

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('notificationId')
    const all = searchParams.get('all') === 'true'

    let query = supabase
      .from('user_notifications')
      .delete()
      .eq('user_id', user.id)

    if (all) {
      // Delete all notifications
    } else if (notificationId) {
      query = query.eq('id', notificationId)
    } else {
      return NextResponse.json({ error: 'notificationId or all=true is required' }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting notifications:', error)
      return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notifications:', error)
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }
}
