import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getFreshnessAlerts } from '@/lib/admin-freshness'

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminSupabaseClient()
    const [
      careers,
      colleges,
      exams,
      profiles,
      userAccounts,
      alerts,
      auditCount,
      scholarships,
      blogPosts,
    ] = await Promise.all([
      supabase.from('careers').select('id', { count: 'exact', head: true }),
      supabase.from('colleges').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_accounts').select('id', { count: 'exact', head: true }),
      getFreshnessAlerts(),
      supabase.from('admin_audit_logs').select('id', { count: 'exact', head: true }),
      supabase.from('scholarships').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    ])

    // Get active users count
    const { count: activeUsersCount } = await supabase
      .from('user_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      counts: {
        careers: careers.count ?? 0,
        colleges: colleges.count ?? 0,
        exams: exams.count ?? 0,
        students: profiles.count ?? 0,
        userAccounts: userAccounts.count ?? 0,
        activeUsers: activeUsersCount ?? 0,
        inactiveUsers: (userAccounts.count ?? 0) - (activeUsersCount ?? 0),
        scholarships: scholarships.count ?? 0,
        blogPosts: blogPosts.count ?? 0,
      },
      alerts: alerts.slice(0, 12),
      alertCount: alerts.length,
      auditCount: auditCount ?? 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
