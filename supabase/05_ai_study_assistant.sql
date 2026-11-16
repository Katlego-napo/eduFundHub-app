-- ============================================
-- EduFund Hub: AI Study Assistant
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.study_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  extracted_text text,           -- populated after text extraction
  created_at timestamptz not null default now()
);

create index if not exists idx_study_documents_user on public.study_documents (user_id);

alter table public.study_documents enable row level security;

create policy "Users can view their own documents"
  on public.study_documents for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can upload their own documents"
  on public.study_documents for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.study_documents for delete
  to authenticated
  using (auth.uid() = user_id);

-- Simple per-day usage tracking, to cap AI cost per user
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  used_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_time on public.ai_usage_log (user_id, used_at);

alter table public.ai_usage_log enable row level security;

create policy "Users can view their own usage"
  on public.ai_usage_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can log their own usage"
  on public.ai_usage_log for insert
  to authenticated
  with check (auth.uid() = user_id);
