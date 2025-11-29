-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Create posts table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create likes table
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;

-- Profiles policies
create policy "Allow users to view all profiles"
  on public.profiles for select
  using (true);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow users to insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Posts policies
create policy "Allow users to view all posts"
  on public.posts for select
  using (true);

create policy "Allow users to create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Allow users to delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Likes policies
create policy "Allow users to view all likes"
  on public.likes for select
  using (true);

create policy "Allow users to create likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Allow users to delete their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Create function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
