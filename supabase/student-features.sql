-- CareerGuide student-facing features tables.
-- Run this in the Supabase SQL editor once.

-- IMPORTANT: First drop the problematic foreign key constraints
alter table public.user_saved_careers drop constraint if exists user_saved_careers_user_id_fkey;

-- Now recreate the table without the auth.users foreign key
drop table if exists public.user_saved_careers cascade;

create table public.user_saved_careers (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  career_id uuid not null references public.careers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, career_id)
);

alter table public.user_saved_careers enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own saved careers" on public.user_saved_careers;
drop policy if exists "Users can insert own saved careers" on public.user_saved_careers;
drop policy if exists "Users can delete own saved careers" on public.user_saved_careers;

-- Policy: Users can only see their own saved careers
create policy "Users can view own saved careers"
  on public.user_saved_careers for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own saved careers
create policy "Users can insert own saved careers"
  on public.user_saved_careers for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own saved careers
create policy "Users can delete own saved careers"
  on public.user_saved_careers for delete
  using (auth.uid() = user_id);

-- Saved colleges table
drop table if exists public.user_saved_colleges cascade;

create table public.user_saved_colleges (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  college_id uuid not null references public.colleges(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, college_id)
);

alter table public.user_saved_colleges enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own saved colleges" on public.user_saved_colleges;
drop policy if exists "Users can insert own saved colleges" on public.user_saved_colleges;
drop policy if exists "Users can delete own saved colleges" on public.user_saved_colleges;

-- Policy: Users can only see their own saved colleges
create policy "Users can view own saved colleges"
  on public.user_saved_colleges for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own saved colleges
create policy "Users can insert own saved colleges"
  on public.user_saved_colleges for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own saved colleges
create policy "Users can delete own saved colleges"
  on public.user_saved_colleges for delete
  using (auth.uid() = user_id);

-- Saved exams table
drop table if exists public.user_saved_exams cascade;

create table public.user_saved_exams (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  exam_id uuid not null references public.exams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, exam_id)
);

alter table public.user_saved_exams enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own saved exams" on public.user_saved_exams;
drop policy if exists "Users can insert own saved exams" on public.user_saved_exams;
drop policy if exists "Users can delete own saved exams" on public.user_saved_exams;

-- Policy: Users can only see their own saved exams
create policy "Users can view own saved exams"
  on public.user_saved_exams for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own saved exams
create policy "Users can insert own saved exams"
  on public.user_saved_exams for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own saved exams
create policy "Users can delete own saved exams"
  on public.user_saved_exams for delete
  using (auth.uid() = user_id);

-- Recommendation history table
drop table if exists public.user_recommendation_history cascade;

create table public.user_recommendation_history (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  stream text not null,
  subjects jsonb not null,
  recommendations jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.user_recommendation_history enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own recommendation history" on public.user_recommendation_history;
drop policy if exists "Users can insert own recommendation history" on public.user_recommendation_history;

-- Policy: Users can only see their own recommendation history
create policy "Users can view own recommendation history"
  on public.user_recommendation_history for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own recommendation history
create policy "Users can insert own recommendation history"
  on public.user_recommendation_history for insert
  with check (auth.uid() = user_id);

-- Indexes for better performance
create index if not exists idx_user_saved_careers_user_id on public.user_saved_careers(user_id);
create index if not exists idx_user_saved_careers_career_id on public.user_saved_careers(career_id);
create index if not exists idx_user_saved_colleges_user_id on public.user_saved_colleges(user_id);
create index if not exists idx_user_saved_colleges_college_id on public.user_saved_colleges(college_id);
create index if not exists idx_user_saved_exams_user_id on public.user_saved_exams(user_id);
create index if not exists idx_user_saved_exams_exam_id on public.user_saved_exams(exam_id);
create index if not exists idx_user_recommendation_history_user_id on public.user_recommendation_history(user_id);

-- Roadmap progress tracking table
create table if not exists public.user_roadmap_progress (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  milestone_id uuid not null,
  milestone_title text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, roadmap_id, milestone_id)
);

alter table public.user_roadmap_progress enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own roadmap progress" on public.user_roadmap_progress;
drop policy if exists "Users can insert own roadmap progress" on public.user_roadmap_progress;
drop policy if exists "Users can update own roadmap progress" on public.user_roadmap_progress;
drop policy if exists "Users can delete own roadmap progress" on public.user_roadmap_progress;

-- Policy: Users can only see their own roadmap progress
create policy "Users can view own roadmap progress"
  on public.user_roadmap_progress for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own roadmap progress
create policy "Users can insert own roadmap progress"
  on public.user_roadmap_progress for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own roadmap progress
create policy "Users can update own roadmap progress"
  on public.user_roadmap_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own roadmap progress
create policy "Users can delete own roadmap progress"
  on public.user_roadmap_progress for delete
  using (auth.uid() = user_id);

-- Indexes for roadmap progress
create index if not exists idx_user_roadmap_progress_user_id on public.user_roadmap_progress(user_id);
create index if not exists idx_user_roadmap_progress_roadmap_id on public.user_roadmap_progress(roadmap_id);

-- Scholarships table
create table if not exists public.scholarships (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  provider text not null,
  amount_min numeric,
  amount_max numeric,
  amount_type text not null, -- 'fixed', 'range', 'full_tuition', 'partial_tuition', 'stipend'
  eligibility_criteria text,
  required_documents text[],
  application_deadline timestamptz,
  application_url text,
  category text, -- 'merit', 'need_based', 'sports', 'arts', 'minority', 'women', 'general'
  level text, -- 'school', 'undergraduate', 'postgraduate', 'phd'
  field_of_study text[],
  country text default 'India',
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scholarships enable row level security;

-- Policy: Allow all users (including anonymous) to read active scholarships
create policy "Public can read active scholarships"
  on public.scholarships for select
  using (is_active = true);

-- Policy: Allow service role to manage scholarships
create policy "Service role can manage scholarships"
  on public.scholarships for all
  using (auth.role() = 'service_role');

-- Indexes for scholarships
create index if not exists idx_scholarships_category on public.scholarships(category);
create index if not exists idx_scholarships_level on public.scholarships(level);
create index if not exists idx_scholarships_is_active on public.scholarships(is_active);
create index if not exists idx_scholarships_application_deadline on public.scholarships(application_deadline);

-- Scholarship applications table
create table if not exists public.user_scholarship_applications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  status text not null default 'applied', -- 'applied', 'shortlisted', 'rejected', 'awarded', 'withdrawn'
  application_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, scholarship_id)
);

alter table public.user_scholarship_applications enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own scholarship applications" on public.user_scholarship_applications;
drop policy if exists "Users can insert own scholarship applications" on public.user_scholarship_applications;
drop policy if exists "Users can update own scholarship applications" on public.user_scholarship_applications;
drop policy if exists "Users can delete own scholarship applications" on public.user_scholarship_applications;

-- Policy: Users can only see their own scholarship applications
create policy "Users can view own scholarship applications"
  on public.user_scholarship_applications for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own scholarship applications
create policy "Users can insert own scholarship applications"
  on public.user_scholarship_applications for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own scholarship applications
create policy "Users can update own scholarship applications"
  on public.user_scholarship_applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own scholarship applications
create policy "Users can delete own scholarship applications"
  on public.user_scholarship_applications for delete
  using (auth.uid() = user_id);

-- Indexes for scholarship applications
create index if not exists idx_user_scholarship_applications_user_id on public.user_scholarship_applications(user_id);
create index if not exists idx_user_scholarship_applications_scholarship_id on public.user_scholarship_applications(scholarship_id);
create index if not exists idx_user_scholarship_applications_status on public.user_scholarship_applications(status);

-- Student notifications table
create table if not exists public.user_notifications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  type text not null, -- 'exam_reminder', 'saved_item_update', 'recommendation', 'system', 'scholarship'
  title text not null,
  message text not null,
  link text, -- optional link to relevant page
  is_read boolean not null default false,
  metadata jsonb, -- additional data like exam_id, scholarship_id, etc.
  created_at timestamptz not null default now(),
  expires_at timestamptz -- optional expiration for time-sensitive notifications
);

alter table public.user_notifications enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "Users can view own notifications" on public.user_notifications;
drop policy if exists "Users can insert own notifications" on public.user_notifications;
drop policy if exists "Users can update own notifications" on public.user_notifications;
drop policy if exists "Users can delete own notifications" on public.user_notifications;

-- Policy: Users can only see their own notifications
create policy "Users can view own notifications"
  on public.user_notifications for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own notifications (for system-generated notifications, this would be bypassed by service role)
create policy "Users can insert own notifications"
  on public.user_notifications for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.user_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
create policy "Users can delete own notifications"
  on public.user_notifications for delete
  using (auth.uid() = user_id);

-- Indexes for notifications
create index if not exists idx_user_notifications_user_id on public.user_notifications(user_id);
create index if not exists idx_user_notifications_type on public.user_notifications(type);
create index if not exists idx_user_notifications_is_read on public.user_notifications(is_read);
create index if not exists idx_user_notifications_created_at on public.user_notifications(created_at);
create index if not exists idx_user_notifications_expires_at on public.user_notifications(expires_at);

-- Blog posts table
create table if not exists public.blog_posts (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  author text not null,
  category text not null, -- 'career_tips', 'exam_prep', 'industry_news', 'success_stories', 'study_tips'
  cover_image text,
  tags text[],
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Policy: Allow all users (including anonymous) to read published blog posts
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (is_published = true);

-- Policy: Allow service role to manage blog posts
create policy "Service role can manage blog posts"
  on public.blog_posts for all
  using (auth.role() = 'service_role');

-- Indexes for blog posts
create index if not exists idx_blog_posts_category on public.blog_posts(category);
create index if not exists idx_blog_posts_is_published on public.blog_posts(is_published);
create index if not exists idx_blog_posts_published_at on public.blog_posts(published_at);
create index if not exists idx_blog_posts_tags on public.blog_posts using gin(tags);
