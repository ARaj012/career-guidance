-- Exam Tracking, Notifications & Countdown Calendar System
-- Run this in the Supabase SQL editor once

-- ============================================
-- 1. Enhance user_saved_exams table for tracking
-- ============================================

-- Add tracking type column to distinguish between "interested" and "definitely giving"
alter table public.user_saved_exams 
add column if not exists tracking_type text not null default 'interested' 
check (tracking_type in ('interested', 'definitely_giving'));

-- Add notes column for user's personal notes
alter table public.user_saved_exams 
add column if not exists notes text;

-- Add priority column for sorting
alter table public.user_saved_exams 
add column if not exists priority integer not null default 0;

-- Add status that auto-updates based on exam dates
alter table public.user_saved_exams 
add column if not exists current_status text 
check (current_status in ('interested', 'registration_open', 'registration_closing_soon', 'registration_closed', 'admit_card_available', 'exam_approaching', 'exam_today', 'exam_completed', 'result_declared'));

-- Add status last updated timestamp
alter table public.user_saved_exams 
add column if not exists status_updated_at timestamptz;

-- ============================================
-- 2. Exam Milestones table for important dates
-- ============================================

create table if not exists public.exam_milestones (
  id uuid not null default gen_random_uuid() primary key,
  exam_id uuid not null references public.exams(id) on delete cascade,
  milestone_type text not null, -- 'registration_start', 'registration_end', 'admit_card_release', 'exam_date', 'answer_key_release', 'result_declaration', 'correction_window', 'other'
  title text not null,
  description text,
  milestone_date timestamptz not null,
  is_critical boolean not null default false, -- Whether this is a critical deadline
  notification_days_before integer[], -- Days before to send notifications [60, 30, 15, 7, 3, 1, 0]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_milestones enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public can read exam milestones" on public.exam_milestones;
drop policy if exists "Service role can manage exam milestones" on public.exam_milestones;

-- Policy: Allow all users to read exam milestones
create policy "Public can read exam milestones"
  on public.exam_milestones for select
  using (true);

-- Policy: Allow service role to manage exam milestones
create policy "Service role can manage exam milestones"
  on public.exam_milestones for all
  using (auth.role() = 'service_role');

-- Indexes for exam milestones
create index if not exists idx_exam_milestones_exam_id on public.exam_milestones(exam_id);
create index if not exists idx_exam_milestones_milestone_type on public.exam_milestones(milestone_type);
create index if not exists idx_exam_milestones_milestone_date on public.exam_milestones(milestone_date);

-- ============================================
-- 3. User Exam Tracking Preferences
-- ============================================

create table if not exists public.user_exam_tracking_preferences (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  exam_id uuid references public.exams(id) on delete cascade,
  
  -- Notification preferences
  notify_registration_start boolean not null default true,
  notify_registration_end boolean not null default true,
  notify_admit_card boolean not null default true,
  notify_exam_date boolean not null default true,
  notify_answer_key boolean not null default true,
  notify_result boolean not null default true,
  notify_date_changes boolean not null default true,
  notify_general_updates boolean not null default true,
  
  -- Countdown preferences
  countdown_reminders boolean not null default true,
  countdown_days integer[] not null default '{60, 30, 15, 7, 3, 1, 0}', -- Days before exam to send countdown
  
  -- Exam-specific enable/disable
  is_tracking_enabled boolean not null default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(user_id, exam_id)
);

alter table public.user_exam_tracking_preferences enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own exam tracking preferences" on public.user_exam_tracking_preferences;
drop policy if exists "Users can insert own exam tracking preferences" on public.user_exam_tracking_preferences;
drop policy if exists "Users can update own exam tracking preferences" on public.user_exam_tracking_preferences;
drop policy if exists "Users can delete own exam tracking preferences" on public.user_exam_tracking_preferences;

-- Policy: Users can only see their own tracking preferences
create policy "Users can view own exam tracking preferences"
  on public.user_exam_tracking_preferences for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own tracking preferences
create policy "Users can insert own exam tracking preferences"
  on public.user_exam_tracking_preferences for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own tracking preferences
create policy "Users can update own exam tracking preferences"
  on public.user_exam_tracking_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own tracking preferences
create policy "Users can delete own exam tracking preferences"
  on public.user_exam_tracking_preferences for delete
  using (auth.uid() = user_id);

-- Indexes for tracking preferences
create index if not exists idx_user_exam_tracking_preferences_user_id on public.user_exam_tracking_preferences(user_id);
create index if not exists idx_user_exam_tracking_preferences_exam_id on public.user_exam_tracking_preferences(exam_id);

-- ============================================
-- 4. Enhance user_notifications for exam-specific notifications
-- ============================================

-- Add exam-specific notification types if not already present
-- The existing table already supports this with the 'type' column

-- ============================================
-- 5. Create helper function to calculate exam status
-- ============================================

create or replace function public.calculate_exam_status(
  p_exam_id uuid,
  p_current_date timestamptz default now()
)
returns text as $$
declare
  v_registration_start timestamptz;
  v_registration_end timestamptz;
  v_exam_date timestamptz;
  v_result_date timestamptz;
  v_admit_card_date timestamptz;
  days_until_reg_end integer;
  days_until_exam integer;
begin
  -- Get exam dates from exam_schedules
  select 
    registration_start,
    registration_end,
    exam_date_start,
    result_date
  into v_registration_start, v_registration_end, v_exam_date, v_result_date
  from public.exam_schedules
  where exam_id = p_exam_id
  order by year desc
  limit 1;
  
  -- Get admit card date from milestones
  select milestone_date into v_admit_card_date
  from public.exam_milestones
  where exam_id = p_exam_id
  and milestone_type = 'admit_card_release'
  order by milestone_date desc
  limit 1;
  
  -- Calculate status based on dates
  if v_result_date is not null and p_current_date > v_result_date then
    return 'result_declared';
  elsif v_exam_date is not null and p_current_date > v_exam_date then
    return 'exam_completed';
  elsif v_exam_date is not null and p_current_date::date = v_exam_date::date then
    return 'exam_today';
  elsif v_exam_date is not null then
    days_until_exam := extract(day from (v_exam_date - p_current_date));
    if days_until_exam <= 3 then
      return 'exam_approaching';
    end if;
  end if;
  
  if v_admit_card_date is not null and p_current_date >= v_admit_card_date and 
     (v_exam_date is null or p_current_date < v_exam_date) then
    return 'admit_card_available';
  end if;
  
  if v_registration_end is not null then
    days_until_reg_end := extract(day from (v_registration_end - p_current_date));
    if days_until_reg_end <= 7 and days_until_reg_end > 0 then
      return 'registration_closing_soon';
    elsif p_current_date > v_registration_end then
      return 'registration_closed';
    end if;
  end if;
  
  if v_registration_start is not null and p_current_date >= v_registration_start and 
     (v_registration_end is null or p_current_date <= v_registration_end) then
    return 'registration_open';
  end if;
  
  return 'interested';
end;
$$ language plpgsql;

-- ============================================
-- 6. Create function to update all tracked exam statuses
-- ============================================

create or replace function public.update_tracked_exam_statuses()
returns void as $$
begin
  update public.user_saved_exams
  set 
    current_status = public.calculate_exam_status(exam_id),
    status_updated_at = now()
  where current_status is null 
     or status_updated_at is null 
     or status_updated_at < now() - interval '1 day';
end;
$$ language plpgsql;

-- ============================================
-- 7. Create function to generate exam notifications
-- ============================================

create or replace function public.generate_exam_notifications()
returns void as $$
declare
  v_user_record record;
  v_milestone record;
  v_days_until integer;
  v_should_notify boolean;
begin
  -- For each tracked exam
  for v_user_record in 
    select use.user_id, use.exam_id, use.current_status, uetp.*
    from public.user_saved_exams use
    left join public.user_exam_tracking_preferences uetp on use.user_id = uetp.user_id and use.exam_id = uetp.exam_id
    where use.current_status is not null
  loop
    -- Check each milestone
    for v_milestone in 
      select * from public.exam_milestones
      where exam_id = v_user_record.exam_id
      and milestone_date >= now()
    loop
      v_days_until := extract(day from (v_milestone.milestone_date - now()));
      v_should_notify := false;
      
      -- Check if we should notify based on user preferences
      if v_milestone.milestone_type = 'registration_start' and v_user_record.notify_registration_start then
        v_should_notify := true;
      elsif v_milestone.milestone_type = 'registration_end' and v_user_record.notify_registration_end then
        v_should_notify := true;
      elsif v_milestone.milestone_type = 'admit_card_release' and v_user_record.notify_admit_card then
        v_should_notify := true;
      elsif v_milestone.milestone_type = 'exam_date' and v_user_record.notify_exam_date then
        v_should_notify := true;
      elsif v_milestone.milestone_type = 'answer_key_release' and v_user_record.notify_answer_key then
        v_should_notify := true;
      elsif v_milestone.milestone_type = 'result_declaration' and v_user_record.notify_result then
        v_should_notify := true;
      end if;
      
      -- Check if this is a countdown day
      if v_should_notify and v_user_record.countdown_reminders then
        if v_days_until = any(v_user_record.countdown_days) then
          v_should_notify := true;
        else
          v_should_notify := false;
        end if;
      end if;
      
      -- Generate notification if needed
      if v_should_notify then
        insert into public.user_notifications (
          user_id,
          type,
          title,
          message,
          link,
          metadata,
          expires_at
        ) values (
          v_user_record.user_id,
          'exam_reminder',
          v_milestone.title,
          case 
            when v_days_until = 0 then 'Today is the day!'
            when v_days_until = 1 then 'Tomorrow!'
            when v_days_until < 7 then 'In ' || v_days_until || ' days'
            else format('%s days remaining', v_days_until)
          end,
          '/exams/' || (select slug from public.exams where id = v_user_record.exam_id),
          jsonb_build_object(
            'exam_id', v_user_record.exam_id,
            'milestone_type', v_milestone.milestone_type,
            'milestone_date', v_milestone.milestone_date,
            'days_until', v_days_until
          ),
          v_milestone.milestone_date + interval '7 days'
        ) on conflict do nothing;
      end if;
    end loop;
  end loop;
end;
$$ language plpgsql;

-- ============================================
-- 8. Update indexes for better performance
-- ============================================

create index if not exists idx_user_saved_exams_tracking_type on public.user_saved_exams(tracking_type);
create index if not exists idx_user_saved_exams_current_status on public.user_saved_exams(current_status);
create index if not exists idx_user_saved_exams_priority on public.user_saved_exams(priority);
create index if not exists idx_user_saved_exams_status_updated_at on public.user_saved_exams(status_updated_at);

-- ============================================
-- 9. Grant execute permissions on functions
-- ============================================

grant execute on function public.calculate_exam_status to anon, authenticated;
grant execute on function public.update_tracked_exam_statuses to service_role;
grant execute on function public.generate_exam_notifications to service_role;
