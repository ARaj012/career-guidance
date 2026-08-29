import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create user account record if it doesn't exist
      await supabase.from('user_accounts').upsert({
        user_id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata?.full_name || null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

      // Create free subscription for new users
      await supabase.rpc('create_free_subscription', { p_user_id: data.user.id })
    }
  }

  const next = searchParams.get('next')
  const destination = next && next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`

  return NextResponse.redirect(destination)
}