-- ============================================================
-- AI Study - Supabase Schema Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  tier        text not null default 'free' check (tier in ('free', 'plus', 'pro', 'pro+')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Credits
create table if not exists public.credits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  balance         integer not null default 5,
  tier            text not null default 'free' check (tier in ('free', 'plus', 'pro', 'pro+')),
  last_reset_at   timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id)
);

alter table public.credits enable row level security;

drop policy if exists "Users can view own credits" on public.credits;
create policy "Users can view own credits"
  on public.credits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own credits" on public.credits;
create policy "Users can update own credits"
  on public.credits for update
  using (auth.uid() = user_id);

-- Auto-create credits row on profile creation
create or replace function public.handle_new_credits()
returns trigger as $$
begin
  insert into public.credits (user_id, balance, tier)
  values (new.id, 50, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_credits();

-- 3. Subscriptions
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  provider        text not null check (provider in ('stripe', 'paypal', 'lemonsqueezy', 'paddle', 'payoneer')),
  provider_id     text,
  tier            text not null check (tier in ('plus', 'pro', 'pro+')),
  status          text not null default 'active' check (status in ('active', 'canceled', 'expired', 'past_due')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage subscriptions" on public.subscriptions;
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- 4. Conversations
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'New Conversation',
  mode        text not null default 'chat' check (mode in ('solver', 'visualizer', 'chat')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.conversations enable row level security;

drop policy if exists "Users can CRUD own conversations" on public.conversations;
create policy "Users can CRUD own conversations"
  on public.conversations for all
  using (auth.uid() = user_id);

-- 5. Messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  reasoning       text,
  images          jsonb default '[]'::jsonb,
  files           jsonb default '[]'::jsonb,
  meta            jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "Users can CRUD own messages" on public.messages;
create policy "Users can CRUD own messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );

-- 6. Questions (Question Bank)
create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  answer          text,
  subject         text,
  course          text,
  tags            text[] default '{}',
  difficulty      text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  source_mode     text,
  source          text not null default 'manual',
  review_count    integer not null default 0,
  last_reviewed   timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.questions enable row level security;

drop policy if exists "Users can CRUD own questions" on public.questions;
create policy "Users can CRUD own questions"
  on public.questions for all
  using (auth.uid() = user_id);

-- 7. Exam Results
create table if not exists public.exam_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  score       integer not null,
  total       integer not null,
  percentage  numeric(5,2) not null,
  time_spent  integer not null,
  difficulty  text,
  subjects    text[] default '{}',
  questions   jsonb not null default '[]'::jsonb,
  started_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.exam_results enable row level security;

drop policy if exists "Users can CRUD own exam results" on public.exam_results;
create policy "Users can CRUD own exam results"
  on public.exam_results for all
  using (auth.uid() = user_id);

-- 8. Knowledge Base Entries
create table if not exists public.knowledge_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  entry_type  text not null default 'note' check (entry_type in ('mermaid', 'note', 'summary', 'visualization', 'file')),
  tags        text[] default '{}',
  course      text,
  subject     text,
  source_mode text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.knowledge_entries enable row level security;

drop policy if exists "Users can CRUD own knowledge entries" on public.knowledge_entries;
create policy "Users can CRUD own knowledge entries"
  on public.knowledge_entries for all
  using (auth.uid() = user_id);

-- 9. Wiki Entries
create table if not exists public.wiki_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  content     text not null,
  tags        text[] default '{}',
  category    text not null default 'note' check (category in ('theorem', 'definition', 'formula', 'note', 'concept')),
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.wiki_entries enable row level security;

drop policy if exists "Users can CRUD own wiki entries" on public.wiki_entries;
create policy "Users can CRUD own wiki entries"
  on public.wiki_entries for all
  using (auth.uid() = user_id);

-- 10. Wiki Links (graph relationships)
create table if not exists public.wiki_links (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid not null references public.wiki_entries(id) on delete cascade,
  target_id   uuid not null references public.wiki_entries(id) on delete cascade,
  label       text,
  created_at  timestamptz not null default now(),
  unique(source_id, target_id)
);

alter table public.wiki_links enable row level security;

drop policy if exists "Users can CRUD own wiki links" on public.wiki_links;
create policy "Users can CRUD own wiki links"
  on public.wiki_links for all
  using (
    exists (
      select 1 from public.wiki_entries
      where wiki_entries.id = wiki_links.source_id
        and wiki_entries.user_id = auth.uid()
    )
  );

-- 11. Indexes for performance
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_questions_user_id on public.questions(user_id);
create index if not exists idx_knowledge_entries_user_id on public.knowledge_entries(user_id);
create index if not exists idx_wiki_entries_user_id on public.wiki_entries(user_id);
create index if not exists idx_exam_results_user_id on public.exam_results(user_id);
create index if not exists idx_credits_user_id on public.credits(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_questions_tags on public.questions using gin(tags);
create index if not exists idx_knowledge_entries_tags on public.knowledge_entries using gin(tags);
create index if not exists idx_wiki_entries_tags on public.wiki_entries using gin(tags);
