// apps/web/src/lib/supabase-chat.ts
//
// A plain Supabase client for the chatbot's server-side tool calls.
// Unlike `supabase-server.ts` (which is likely tied to request cookies for
// user auth in Server Components), this one just needs the public anon key
// since every table the chatbot reads from (colleges, college_courses,
// college_exam_cutoffs, college_placements, exams, careers, etc.) already
// has public SELECT RLS policies — no user session required.
//
// Requires these in .env.local (same values you already use elsewhere):
//   NEXT_PUBLIC_SUPABASE_URL=...
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars — required for the chatbot tool client.'
  )
}

export const supabaseChat = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})
