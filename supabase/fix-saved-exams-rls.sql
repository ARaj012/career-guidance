-- Fix RLS policies for user_saved_exams to allow users to manage their own saved exams
-- Run this in Supabase SQL Editor

-- Drop existing policies
drop policy if exists "Users can read own saved exams" on public.user_saved_exams;
drop policy if exists "Users can insert own saved exams" on public.user_saved_exams;
drop policy if exists "Users can update own saved exams" on public.user_saved_exams;
drop policy if exists "Users can delete own saved exams" on public.user_saved_exams;
drop policy if exists "Service role can manage saved exams" on public.user_saved_exams;

-- Create comprehensive policies for user_saved_exams
create policy "Users can read own saved exams"
  on public.user_saved_exams for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved exams"
  on public.user_saved_exams for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved exams"
  on public.user_saved_exams for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own saved exams"
  on public.user_saved_exams for delete
  using (auth.uid() = user_id);

create policy "Service role can manage saved exams"
  on public.user_saved_exams for all
  using (auth.role() = 'service_role');
