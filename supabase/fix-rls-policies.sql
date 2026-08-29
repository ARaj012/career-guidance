-- Complete RLS Policies for Career Guidance Platform
-- Run this in Supabase SQL Editor to fix data visibility issues

-- ============================================
-- BLOG POSTS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read published blog posts" on public.blog_posts;
drop policy if exists "Service role can manage blog posts" on public.blog_posts;

-- Allow all users (including anonymous) to read published blog posts
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (is_published = true);

-- Allow service role to manage blog posts
create policy "Service role can manage blog posts"
  on public.blog_posts for all
  using (auth.role() = 'service_role');

-- ============================================
-- SCHOLARSHIPS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read active scholarships" on public.scholarships;
drop policy if exists "Service role can manage scholarships" on public.scholarships;

-- Allow all users (including anonymous) to read active scholarships
create policy "Public can read active scholarships"
  on public.scholarships for select
  using (is_active = true);

-- Allow service role to manage scholarships
create policy "Service role can manage scholarships"
  on public.scholarships for all
  using (auth.role() = 'service_role');

-- ============================================
-- CAREERS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read careers" on public.careers;
drop policy if exists "Service role can manage careers" on public.careers;

-- Allow all users to read careers
create policy "Public can read careers"
  on public.careers for select
  using (true);

-- Allow service role to manage careers
create policy "Service role can manage careers"
  on public.careers for all
  using (auth.role() = 'service_role');

-- ============================================
-- COLLEGES RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read colleges" on public.colleges;
drop policy if exists "Service role can manage colleges" on public.colleges;

-- Allow all users to read colleges
create policy "Public can read colleges"
  on public.colleges for select
  using (true);

-- Allow service role to manage colleges
create policy "Service role can manage colleges"
  on public.colleges for all
  using (auth.role() = 'service_role');

-- ============================================
-- EXAMS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read exams" on public.exams;
drop policy if exists "Service role can manage exams" on public.exams;

-- Allow all users to read exams
create policy "Public can read exams"
  on public.exams for select
  using (true);

-- Allow service role to manage exams
create policy "Service role can manage exams"
  on public.exams for all
  using (auth.role() = 'service_role');

-- ============================================
-- USER PROFILES RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Users can read own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Service role can manage profiles" on public.user_profiles;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

-- Allow service role to manage profiles
create policy "Service role can manage profiles"
  on public.user_profiles for all
  using (auth.role() = 'service_role');

-- ============================================
-- USER SAVED CAREERS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Users can manage own saved careers" on public.user_saved_careers;
drop policy if exists "Service role can manage saved careers" on public.user_saved_careers;

-- Allow users to manage their own saved careers
create policy "Users can manage own saved careers"
  on public.user_saved_careers for all
  using (auth.uid() = user_id);

-- Allow service role to manage saved careers
create policy "Service role can manage saved careers"
  on public.user_saved_careers for all
  using (auth.role() = 'service_role');

-- ============================================
-- USER SAVED COLLEGES RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Users can manage own saved colleges" on public.user_saved_colleges;
drop policy if exists "Service role can manage saved colleges" on public.user_saved_colleges;

-- Allow users to manage their own saved colleges
create policy "Users can manage own saved colleges"
  on public.user_saved_colleges for all
  using (auth.uid() = user_id);

-- Allow service role to manage saved colleges
create policy "Service role can manage saved colleges"
  on public.user_saved_colleges for all
  using (auth.role() = 'service_role');

-- ============================================
-- USER SAVED EXAMS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Users can manage own saved exams" on public.user_saved_exams;
drop policy if exists "Service role can manage saved exams" on public.user_saved_exams;

-- Allow users to manage their own saved exams
create policy "Users can manage own saved exams"
  on public.user_saved_exams for all
  using (auth.uid() = user_id);

-- Allow service role to manage saved exams
create policy "Service role can manage saved exams"
  on public.user_saved_exams for all
  using (auth.role() = 'service_role');

-- ============================================
-- SKILLS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read skills" on public.skills;
drop policy if exists "Service role can manage skills" on public.skills;

-- Allow all users to read skills
create policy "Public can read skills"
  on public.skills for select
  using (true);

-- Allow service role to manage skills
create policy "Service role can manage skills"
  on public.skills for all
  using (auth.role() = 'service_role');

-- ============================================
-- SUBJECTS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read subjects" on public.subjects;
drop policy if exists "Service role can manage subjects" on public.subjects;

-- Allow all users to read subjects
create policy "Public can read subjects"
  on public.subjects for select
  using (true);

-- Allow service role to manage subjects
create policy "Service role can manage subjects"
  on public.subjects for all
  using (auth.role() = 'service_role');

-- ============================================
-- ROADMAPS RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
drop policy if exists "Public can read roadmaps" on public.roadmaps;
drop policy if exists "Service role can manage roadmaps" on public.roadmaps;

-- Allow all users to read roadmaps
create policy "Public can read roadmaps"
  on public.roadmaps for select
  using (true);

-- Allow service role to manage roadmaps
create policy "Service role can manage roadmaps"
  on public.roadmaps for all
  using (auth.role() = 'service_role');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if policies are applied correctly
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where schemaname = 'public'
order by tablename, policyname;

-- Test blog posts visibility
select count(*) as published_blog_posts_count 
from public.blog_posts 
where is_published = true;

-- Test scholarships visibility
select count(*) as active_scholarships_count 
from public.scholarships 
where is_active = true;

-- Test careers visibility
select count(*) as careers_count 
from public.careers;

-- Test colleges visibility
select count(*) as colleges_count 
from public.colleges;

-- Test exams visibility
select count(*) as exams_count 
from public.exams;
