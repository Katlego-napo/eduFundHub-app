-- ============================================
-- EduFund Hub: Bursaries + Saved Bursaries
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.bursaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  funder text not null,
  field_of_study text not null,       -- e.g. "Engineering", "All Fields", "Education"
  province text not null,             -- e.g. "National", "Western Cape", "Gauteng"
  closing_date date not null,
  coverage text not null,             -- short summary, e.g. "Full tuition + stipend"
  description text not null,
  eligibility text not null,
  benefits text not null,
  official_url text not null,         -- link to the official application page
  contact_info text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bursaries_field on public.bursaries (field_of_study);
create index if not exists idx_bursaries_province on public.bursaries (province);
create index if not exists idx_bursaries_closing on public.bursaries (closing_date);

alter table public.bursaries enable row level security;

create policy "Anyone can view bursaries"
  on public.bursaries for select
  using (true);

create policy "Authenticated users can insert bursaries"
  on public.bursaries for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update bursaries"
  on public.bursaries for update
  to authenticated
  using (true);

-- ============================================
-- Saved Bursaries (per-user saved items)
-- ============================================

create table if not exists public.saved_bursaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bursary_id uuid not null references public.bursaries (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, bursary_id)
);

alter table public.saved_bursaries enable row level security;

create policy "Users can view their own saved bursaries"
  on public.saved_bursaries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can save bursaries"
  on public.saved_bursaries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unsave their own bursaries"
  on public.saved_bursaries for delete
  to authenticated
  using (auth.uid() = user_id);
