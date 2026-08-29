import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function logAdminAction(params: {
  adminEmail: string
  actionType: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'view'
  tableName: string
  recordId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const supabase = createAdminSupabaseClient()
    await supabase.from('admin_audit_logs').insert({
      admin_email: params.adminEmail,
      action_type: params.actionType,
      table_name: params.tableName,
      record_id: params.recordId,
      old_values: params.oldValues,
      new_values: params.newValues,
      ip_address: params.ipAddress,
      user_agent: params.userAgent
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failures shouldn't break the main operation
  }
}

export async function ensureUserAccount(userId: string, email: string, fullName?: string) {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Check if account exists
    const { data: existing } = await supabase
      .from('user_accounts')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (existing) return existing
    
    // Create new account
    const { data, error } = await supabase
      .from('user_accounts')
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to ensure user account:', error)
    throw error
  }
}