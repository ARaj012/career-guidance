import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getFreshnessAlerts } from '@/lib/admin-freshness'

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const alerts = await getFreshnessAlerts()
    return NextResponse.json({ alerts })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load alerts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
