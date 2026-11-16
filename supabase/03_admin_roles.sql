-- ============================================
-- EduFund Hub: Admin roles
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles table, one row per user, holds the admin flag
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 2. Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Helper function: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 4. Replace the old "any authenticated user" policies with admin-only ones

drop policy if exists "Authenticated users can insert past papers" on public.past_papers;
drop policy if exists "Authenticated users can update past papers" on public.past_papers;

create policy "Admins can insert past papers"
  on public.past_papers for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update past papers"
  on public.past_papers for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Authenticated users can insert bursaries" on public.bursaries;
drop policy if exists "Authenticated users can update bursaries" on public.bursaries;

create policy "Admins can insert bursaries"
  on public.bursaries for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update bursaries"
  on public.bursaries for update
  to authenticated
  using (public.is_admin());

-- 5. Tighten Storage uploads to admins only, too
drop policy if exists "Authenticated users can upload past papers" on storage.objects;

create policy "Admins can upload past papers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'past-papers' and public.is_admin());
