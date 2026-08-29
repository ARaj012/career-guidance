import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { table?: string; id?: string }
  if (!body.table || !body.id) {
    return NextResponse.json({ error: 'table and id required' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const { error } = await supabase.from('admin_reviews').upsert({
      table_name: body.table,
      record_id: body.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.email || 'unknown',
    }, { onConflict: 'table_name,record_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Review failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
