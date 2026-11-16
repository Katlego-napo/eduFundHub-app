-- ============================================
-- EduFund Hub: Blog Posts + Comments
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,        -- e.g. "Study Tips", "NSFAS Information"
  excerpt text not null,
  content text not null,         -- full article body (markdown or plain text)
  cover_color text not null default '#0F4C81', -- placeholder color block, swap for image_url later
  author_name text not null default 'EduFund Hub Team',
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_category on public.blog_posts (category);
create index if not exists idx_blog_posts_created on public.blog_posts (created_at desc);

alter table public.blog_posts enable row level security;

create policy "Anyone can view blog posts"
  on public.blog_posts for select
  using (true);

create policy "Admins can insert blog posts"
  on public.blog_posts for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update blog posts"
  on public.blog_posts for update
  to authenticated
  using (public.is_admin());

-- ============================================
-- Comments
-- ============================================

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_post on public.comments (post_id);

alter table public.comments enable row level security;

create policy "Anyone can view comments"
  on public.comments for select
  using (true);

create policy "Authenticated users can post comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);
