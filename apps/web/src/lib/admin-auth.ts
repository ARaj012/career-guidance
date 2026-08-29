import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { User } from '@supabase/supabase-js'

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return parseAdminEmails().includes(email.toLowerCase())
}

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

export async function requireAdmin(): Promise<User> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  if (!isAdminEmail(user.email)) redirect('/not-admin')
  return user
}
