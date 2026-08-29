import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { WRITABLE_TABLES, RESOURCES, type ResourceKey } from '@/lib/admin-schema'
import { logAdminAction } from '@/lib/admin-audit'

function coerceValue(value: unknown) {
  if (value === '' || value === undefined) return null
  if (value === 'true') return true
  if (value === 'false') return false
  // Handle arrays - ensure they're arrays
  if (Array.isArray(value)) return value
  return value
}

function coercePayload(payload: Record<string, unknown>) {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'id') continue
    // Handle comma-separated strings that should be arrays
    if (typeof value === 'string' && (key === 'required_documents' || key === 'field_of_study' || key === 'tags')) {
      const arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
      next[key] = arrayValue.length > 0 ? arrayValue : null
    } else {
      next[key] = coerceValue(value)
    }
  }
  next.updated_at = new Date().toISOString()
  return next
}

async function requireAdminJson() {
  const user = await getAdminUser()
  if (!user) return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, response: null }
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdminJson()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table') ?? ''
  const id = searchParams.get('id')
  const q = searchParams.get('q')?.trim() ?? ''
  const nestedOf = searchParams.get('nestedOf')
  const parentId = searchParams.get('parentId')

  if (!WRITABLE_TABLES.has(table) && table !== 'user_profiles') {
    return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()

    if (id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ record: data })
    }

    if (nestedOf && parentId) {
      const { data, error } = await supabase.from(table).select('*').eq(nestedOf, parentId)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ records: data ?? [] })
    }

    let query = supabase.from(table).select('*').limit(400)
    const resource = RESOURCES[table as ResourceKey]
    if (q && resource) {
      const filter = resource.searchColumns.map((col) => `${col}.ilike.%${q}%`).join(',')
      query = query.or(filter)
    } else if (q && table === 'user_profiles') {
      query = query.or(`class_level.ilike.%${q}%,stream.ilike.%${q}%,state.ilike.%${q}%,career_goal.ilike.%${q}%`)
    }

    if (table === 'careers') query = query.order('title')
    if (table === 'colleges') query = query.order('name')
    if (table === 'exams') query = query.order('name')
    if (table === 'user_profiles') query = query.order('updated_at', { ascending: false })

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ records: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAdminJson()
  if (response) return response

  const body = await request.json() as { table?: string; payload?: Record<string, unknown> }
  const table = body.table ?? ''
  if (!WRITABLE_TABLES.has(table)) {
    return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const payload = coercePayload(body.payload ?? {})
    let { data, error } = await supabase.from(table).insert(payload).select('*').single()
    if (error && error.message.includes('updated_at')) {
      delete payload.updated_at
      const retry = await supabase.from(table).insert(payload).select('*').single()
      data = retry.data
      error = retry.error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('admin_reviews').upsert({
      table_name: table,
      record_id: data.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.email || 'unknown',
    }, { onConflict: 'table_name,record_id' })

    // Log the create action
    await logAdminAction({
      adminEmail: user!.email || 'unknown',
      actionType: 'create',
      tableName: table,
      recordId: data.id as string,
      newValues: payload,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({ record: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireAdminJson()
  if (response) return response

  const body = await request.json() as { table?: string; id?: string; payload?: Record<string, unknown> }
  const table = body.table ?? ''
  if (!WRITABLE_TABLES.has(table) || !body.id) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    
    // Get old values for audit log
    const { data: oldRecord } = await supabase.from(table).select('*').eq('id', body.id).maybeSingle()
    
    const payload = coercePayload(body.payload ?? {})
    const { data, error } = await supabase.from(table).update(payload).eq('id', body.id).select('*').single()
    if (error) {
      // Some tables may not have updated_at — retry without it
      if (error.message.includes('updated_at')) {
        delete payload.updated_at
        const retry = await supabase.from(table).update(payload).eq('id', body.id).select('*').single()
        if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 })
        
        // Log the update action
        await logAdminAction({
          adminEmail: user!.email || 'unknown',
          actionType: 'update',
          tableName: table,
          recordId: body.id,
          oldValues: oldRecord || undefined,
          newValues: payload,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined
        })
        
        return NextResponse.json({ record: retry.data })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabase.from('admin_reviews').upsert({
      table_name: table,
      record_id: body.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.email || 'unknown',
    }, { onConflict: 'table_name,record_id' })

    // Log the update action
    await logAdminAction({
      adminEmail: user!.email || 'unknown',
      actionType: 'update',
      tableName: table,
      recordId: body.id,
      oldValues: oldRecord || undefined,
      newValues: payload,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({ record: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, response } = await requireAdminJson()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table') ?? ''
  const id = searchParams.get('id')
  if (!WRITABLE_TABLES.has(table) || !id) {
    return NextResponse.json({ error: 'Invalid delete' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    
    // Get old values for audit log before deletion
    const { data: oldRecord } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
    
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    
    // Log the delete action
    await logAdminAction({
      adminEmail: user!.email || 'unknown',
      actionType: 'delete',
      tableName: table,
      recordId: id,
      oldValues: oldRecord || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    })
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
