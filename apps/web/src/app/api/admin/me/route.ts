import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'

export async function GET() {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ admin: false }, { status: 401 })
  }
  return NextResponse.json({
    admin: true,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.email,
  })
}
