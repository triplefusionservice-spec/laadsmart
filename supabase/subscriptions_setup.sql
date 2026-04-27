-- Subscriptions table for Stripe billing state.
-- Run this in Supabase SQL editor.

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  current_period_end timestamptz null,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- User can read their own subscription row
create policy if not exists "subscriptions_read_own"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

-- No direct writes from client; only via service role/webhook

