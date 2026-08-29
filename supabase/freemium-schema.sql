-- Freemium Model Database Schema for Career Guidance Platform
-- Run this in Supabase SQL Editor

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly numeric(10,2) not null,
  price_yearly numeric(10,2) not null,
  currency text default 'INR',
  features jsonb not null,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert subscription plans
insert into public.subscription_plans (id, name, description, price_monthly, price_yearly, features, display_order) values
('free', 'Free', 'Basic career guidance for students starting their journey', 0, 0, 
 '{
  "career_browsing": "limited",
  "college_info": "basic",
  "exam_info": "basic",
  "ai_chat_messages": 5,
  "recommendations": 3,
  "scholarships": "limited",
  "roadmaps": false,
  "career_comparison": false,
  "college_comparison": false,
  "save_items": 10,
  "priority_support": false,
  "career_assessment": false,
  "mentorship": false,
  "advanced_analytics": false
}'::jsonb, 1),

('premium', 'Premium', 'Complete career guidance with unlimited access', 299, 2999,
 '{
  "career_browsing": "unlimited",
  "college_info": "detailed",
  "exam_info": "detailed",
  "ai_chat_messages": "unlimited",
  "recommendations": "unlimited",
  "scholarships": "unlimited",
  "roadmaps": true,
  "career_comparison": true,
  "college_comparison": true,
  "save_items": "unlimited",
  "priority_support": true,
  "career_assessment": true,
  "mentorship": false,
  "advanced_analytics": true
}'::jsonb, 2),

('pro', 'Pro', 'Everything in Premium plus mentorship and career coaching', 599, 5999,
 '{
  "career_browsing": "unlimited",
  "college_info": "detailed",
  "exam_info": "detailed",
  "ai_chat_messages": "unlimited",
  "recommendations": "unlimited",
  "scholarships": "unlimited",
  "roadmaps": true,
  "career_comparison": true,
  "college_comparison": true,
  "save_items": "unlimited",
  "priority_support": true,
  "career_assessment": true,
  "mentorship": true,
  "advanced_analytics": true
}'::jsonb, 3);

-- ============================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'active', -- active, cancelled, expired, past_due
  billing_cycle text not null default 'monthly', -- monthly, yearly
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  payment_method jsonb,
  razorpay_subscription_id text,
  razorpay_customer_id text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================
-- USAGE TRACKING TABLE
-- ============================================

create table if not exists public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_type text not null, -- ai_chat, recommendations, career_browsing, etc.
  usage_count integer default 0,
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, feature_type, period_start)
);

-- ============================================
-- PAYMENT HISTORY TABLE
-- ============================================

create table if not exists public.payment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.user_subscriptions(id) on delete set null,
  amount numeric(10,2) not null,
  currency text default 'INR',
  status text not null, -- pending, completed, failed, refunded
  payment_method text,
  razorpay_payment_id text,
  razorpay_order_id text,
  invoice_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Subscription plans (public read)
alter table public.subscription_plans enable row level security;

create policy "Public can read subscription plans"
  on public.subscription_plans for select
  using (is_active = true);

create policy "Service role can manage subscription plans"
  on public.subscription_plans for all
  using (auth.role() = 'service_role');

-- User subscriptions (user can read own, service role all)
alter table public.user_subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage user subscriptions"
  on public.user_subscriptions for all
  using (auth.role() = 'service_role');

-- User usage (user can read/update own, service role all)
alter table public.user_usage enable row level security;

create policy "Users can manage own usage"
  on public.user_usage for all
  using (auth.uid() = user_id);

create policy "Service role can manage all usage"
  on public.user_usage for all
  using (auth.role() = 'service_role');

-- Payment history (user can read own, service role all)
alter table public.payment_history enable row level security;

create policy "Users can read own payment history"
  on public.payment_history for select
  using (auth.uid() = user_id);

create policy "Service role can manage payment history"
  on public.payment_history for all
  using (auth.role() = 'service_role');

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);
create index if not exists idx_user_subscriptions_plan_id on public.user_subscriptions(plan_id);
create index if not exists idx_user_usage_user_id on public.user_usage(user_id);
create index if not exists idx_user_usage_feature_type on public.user_usage(feature_type);
create index if not exists idx_user_usage_period on public.user_usage(period_start, period_end);
create index if not exists idx_payment_history_user_id on public.payment_history(user_id);
create index if not exists idx_payment_history_status on public.payment_history(status);

-- ============================================
-- FUNCTIONS FOR USAGE TRACKING
-- ============================================

-- Function to increment usage counter
create or replace function public.increment_usage(
  p_user_id uuid,
  p_feature_type text
) returns integer as $$
declare
  v_usage integer;
  v_limit integer;
  v_plan_id text;
begin
  -- Get user's current plan
  select plan_id into v_plan_id
  from public.user_subscriptions
  where user_id = p_user_id and status = 'active'
  limit 1;
  
  -- Default to free plan if no subscription
  if v_plan_id is null then
    v_plan_id := 'free';
  end if;
  
  -- Get usage limit for this feature
  select (features->p_feature_type)::integer into v_limit
  from public.subscription_plans
  where id = v_plan_id;
  
  -- If unlimited, return -1 to indicate no limit
  if v_limit = -1 or v_limit::text = 'unlimited' then
    return -1;
  end if;
  
  -- Get current usage
  select usage_count into v_usage
  from public.user_usage
  where user_id = p_user_id 
    and feature_type = p_feature_type
    and period_start = date_trunc('month', now());
  
  -- If no record exists, create one
  if v_usage is null then
    insert into public.user_usage (user_id, feature_type, usage_count)
    values (p_user_id, p_feature_type, 1)
    on conflict (user_id, feature_type, period_start)
    do update set usage_count = user_usage.usage_count + 1;
    
    return 1;
  end if;
  
  -- Check if limit reached
  if v_usage >= v_limit then
    return v_limit; -- Return limit to indicate reached
  end if;
  
  -- Increment usage
  update public.user_usage
  set usage_count = usage_count + 1,
      updated_at = now()
  where user_id = p_user_id 
    and feature_type = p_feature_type
    and period_start = date_trunc('month', now());
  
  return v_usage + 1;
end;
$$ language plpgsql;

-- Function to get current usage
create or replace function public.get_usage(
  p_user_id uuid,
  p_feature_type text
) returns table(current_usage integer, limit integer, plan_id text) as $$
declare
  v_plan_id text;
  v_limit integer;
begin
  -- Get user's current plan
  select plan_id into v_plan_id
  from public.user_subscriptions
  where user_id = p_user_id and status = 'active'
  limit 1;
  
  -- Default to free plan if no subscription
  if v_plan_id is null then
    v_plan_id := 'free';
  end if;
  
  -- Get usage limit for this feature
  select (features->p_feature_type)::integer into v_limit
  from public.subscription_plans
  where id = v_plan_id;
  
  -- Handle unlimited case
  if v_limit = -1 or v_limit::text = 'unlimited' then
    v_limit := -1;
  end if;
  
  return query
  select 
    coalesce(u.usage_count, 0) as current_usage,
    v_limit as limit,
    v_plan_id as plan_id
  from public.user_usage u
  where u.user_id = p_user_id 
    and u.feature_type = p_feature_type
    and u.period_start = date_trunc('month', now());
end;
$$ language plpgsql;

-- Function to check if user has access to a feature
create or replace function public.has_feature_access(
  p_user_id uuid,
  p_feature text
) returns boolean as $$
declare
  v_plan_id text;
  v_feature_value jsonb;
begin
  -- Get user's current plan
  select plan_id into v_plan_id
  from public.user_subscriptions
  where user_id = p_user_id and status = 'active'
  limit 1;
  
  -- Default to free plan if no subscription
  if v_plan_id is null then
    v_plan_id := 'free';
  end if;
  
  -- Get feature value from plan
  select features->p_feature into v_feature_value
  from public.subscription_plans
  where id = v_plan_id;
  
  -- Check if feature is enabled
  if v_feature_value = 'true'::jsonb or v_feature_value = 'unlimited'::jsonb then
    return true;
  end if;
  
  if v_feature_value = 'false'::jsonb then
    return false;
  end if;
  
  -- For numeric limits, check if user hasn't exceeded
  if v_feature_value::text ~ '^[0-9]+$' then
    return public.get_usage(p_user_id, p_feature).current_usage < v_feature_value::integer;
  end if;
  
  -- Default to true for basic features
  return true;
end;
$$ language plpgsql;

-- ============================================
-- INITIAL DATA AND SETUP
-- ============================================

-- Function to create free subscription for new users
create or replace function public.create_free_subscription(p_user_id uuid)
returns void as $$
begin
  insert into public.user_subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
  values (p_user_id, 'free', 'active', 'monthly', now(), now() + interval '1 year')
  on conflict (user_id) do nothing;
end;
$$ language plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check subscription plans
select * from public.subscription_plans order by display_order;

-- Check if a user has premium access
select public.has_feature_access('user_uuid_here', 'roadmaps');

-- Get usage stats for a user
select * from public.get_usage('user_uuid_here', 'ai_chat_messages');
