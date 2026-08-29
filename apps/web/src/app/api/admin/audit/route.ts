import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const actionType = searchParams.get('actionType')
    const tableName = searchParams.get('tableName')
    const adminEmail = searchParams.get('adminEmail')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    if (tableName) {
      query = query.eq('table_name', tableName)
    }
    if (adminEmail) {
      query = query.ilike('admin_email', `%${adminEmail}%`)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Get total count for pagination
    const { count } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({ 
      logs: data ?? [], 
      total: count ?? 0,
      limit,
      offset
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load audit logs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}