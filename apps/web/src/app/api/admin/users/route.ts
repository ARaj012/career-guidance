import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const status = searchParams.get('status') ?? ''
    const sortBy = searchParams.get('sort_by') ?? 'created_at'
    const sortOrder = searchParams.get('sort_order') ?? 'desc'

    // Get user accounts from auth.users and sync with user_accounts
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // Ensure all auth users have user_accounts records
    for (const authUser of authUsers.users) {
      await supabase.from('user_accounts').upsert({
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    // Get user accounts
    let query = supabase
      .from('user_accounts')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (q) {
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ users: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { 
      user_id?: string
      action?: 'activate' | 'deactivate'
      reason?: string
    }

    if (!body.user_id || !body.action) {
      return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    if (body.action === 'deactivate') {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_by: user.email,
          deactivation_reason: body.reason,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', body.user_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_email: user.email || 'unknown',
        action_type: 'deactivate',
        table_name: 'user_accounts',
        record_id: body.user_id,
        new_values: { is_active: false, reason: body.reason }
      })

    } else if (body.action === 'activate') {
      const { error } = await supabase
        .from('user_accounts')
        .update({
          is_active: true,
          deactivated_at: null,
          deactivated_by: null,
          deactivation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', body.user_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_email: user.email || 'unknown',
        action_type: 'activate',
        table_name: 'user_accounts',
        record_id: body.user_id,
        new_values: { is_active: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}