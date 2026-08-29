-- CareerGuide admin support tables.
-- Run this in the Supabase SQL editor once.

create table if not exists public.admin_reviews (
  table_name text not null,
  record_id uuid not null,
  reviewed_at timestamptz not null default now(),
  reviewed_by text,
  primary key (table_name, record_id)
);

alter table public.admin_reviews enable row level security;

-- Service-role key bypasses RLS. No public policies on purpose.

alter table public.careers add column if not exists updated_at timestamptz;
alter table public.colleges add column if not exists updated_at timestamptz;
alter table public.exams add column if not exists updated_at timestamptz;

-- User account management table
create table if not exists public.user_accounts (
  user_id uuid not null primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  deactivated_at timestamptz,
  deactivated_by text,
  deactivation_reason text,
  updated_at timestamptz not null default now()
);

alter table public.user_accounts enable row level security;

-- Service-role key bypasses RLS. No public policies on purpose.

-- Comprehensive audit logs table
create table if not exists public.admin_audit_logs (
  id uuid not null default gen_random_uuid() primary key,
  admin_email text not null,
  action_type text not null, -- 'create', 'update', 'delete', 'activate', 'deactivate', 'view'
  table_name text not null,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

-- Service-role key bypasses RLS. No public policies on purpose.

-- Enhanced notifications table
create table if not exists public.admin_notifications (
  id uuid not null default gen_random_uuid() primary key,
  type text not null, -- 'freshness', 'system', 'audit', 'security'
  severity text not null, -- 'critical', 'warning', 'info'
  title text not null,
  message text not null,
  table_name text,
  record_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.admin_notifications enable row level security;

-- Service-role key bypasses RLS. No public policies on purpose.
