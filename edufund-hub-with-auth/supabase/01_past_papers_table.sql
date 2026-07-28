-- ============================================
-- EduFund Hub: Past Papers table
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.past_papers (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade text not null,           -- e.g. "Grade 12", "TVET", "University", "IT Courses"
  year text not null,            -- e.g. "2026"
  paper_url text not null,       -- public URL to the paper PDF in storage
  memo_url text,                 -- public URL to the memorandum PDF, optional
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index to speed up the filters we'll use on the Past Papers page
create index if not exists idx_past_papers_subject on public.past_papers (subject);
create index if not exists idx_past_papers_grade on public.past_papers (grade);
create index if not exists idx_past_papers_year on public.past_papers (year);

-- Row Level Security: everyone can read, only logged-in users can write
-- (we'll tighten "write" down to admins only once admin roles exist)
alter table public.past_papers enable row level security;

create policy "Anyone can view past papers"
  on public.past_papers for select
  using (true);

create policy "Authenticated users can insert past papers"
  on public.past_papers for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update past papers"
  on public.past_papers for update
  to authenticated
  using (true);
