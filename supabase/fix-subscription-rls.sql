-- Fix RLS policies for user_subscriptions to allow users to create/update their own subscriptions
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies for user_subscriptions
drop policy if exists "Users can read own subscription" on public.user_subscriptions;
drop policy if exists "Users can insert own subscription" on public.user_subscriptions;
drop policy if exists "Users can update own subscription" on public.user_subscriptions;
drop policy if exists "Service role can manage user subscriptions" on public.user_subscriptions;

-- Create comprehensive policies for user_subscriptions
create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.user_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can manage user subscriptions"
  on public.user_subscriptions for all
  using (auth.role() = 'service_role');

-- Also fix payment_history policies to allow users to insert their own payment records
-- Drop ALL existing policies for payment_history
drop policy if exists "Users can read own payment history" on public.payment_history;
drop policy if exists "Users can insert own payment history" on public.payment_history;
drop policy if exists "Service role can manage payment history" on public.payment_history;

create policy "Users can read own payment history"
  on public.payment_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own payment history"
  on public.payment_history for insert
  with check (auth.uid() = user_id);

create policy "Service role can manage payment history"
  on public.payment_history for all
  using (auth.role() = 'service_role');
