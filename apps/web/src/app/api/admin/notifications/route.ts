import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getFreshnessAlerts } from '@/lib/admin-freshness'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')

    let query = supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: notifications, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { 
      id?: string
      notificationId?: string
      action?: 'mark_read' | 'mark_all_read'
    }

    const supabase = createAdminSupabaseClient()

    if (body.action === 'mark_all_read') {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    const notificationId = body.id || body.notificationId
    if (notificationId && body.action === 'mark_read') {
      // Check if it's a freshness alert (can't mark those as read via this API)
      if (notificationId.startsWith('freshness-')) {
        return NextResponse.json({ error: 'Use the review API for freshness alerts' }, { status: 400 })
      }

      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as {
      type?: string
      severity?: string
      title?: string
      message?: string
      table_name?: string
      record_id?: string
      expires_at?: string
    }

    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        type: body.type || 'system',
        severity: body.severity || 'info',
        title: body.title,
        message: body.message,
        table_name: body.table_name || null,
        record_id: body.record_id || null,
        expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log the action
    await supabase.from('admin_audit_logs').insert({
      admin_email: user.email || 'unknown',
      action_type: 'create',
      table_name: 'admin_notifications',
      record_id: data.id,
      new_values: { title: body.title, type: body.type }
    })

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { id?: string }

    if (!body.id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    // Check if it's a freshness alert (can't delete those via this API)
    if (body.id.startsWith('freshness-')) {
      return NextResponse.json({ error: 'Cannot delete freshness alerts' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', body.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log the action
    await supabase.from('admin_audit_logs').insert({
      admin_email: user.email || 'unknown',
      action_type: 'delete',
      table_name: 'admin_notifications',
      record_id: body.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}