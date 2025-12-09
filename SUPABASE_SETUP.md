# Supabase Setup Guide

This project uses Supabase for the backend (Authentication, Database, Realtime).

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Note down the `Project URL` and `Anon Key` from the API settings.

## 2. Database Schema

Run the following SQL in the Supabase SQL Editor to set up the tables:

```sql
-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'staff', 'employee')) default 'employee',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'employee');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Attendance Table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  date date default current_date,
  status text check (status in ('present', 'absent', 'late', 'excused')) default 'present',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendance enable row level security;

create policy "Users can view their own attendance."
  on attendance for select
  using ( auth.uid() = user_id );

create policy "Admins can view all attendance."
  on attendance for select
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert their own attendance."
  on attendance for insert
  with check ( auth.uid() = user_id );

-- Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  due_date timestamp with time zone,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

-- Chat Messages (Simple)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
create policy "Everyone can read messages" on messages for select using (true);
create policy "Authenticated users can insert messages" on messages for insert with check (auth.role() = 'authenticated');
```

## 3. Environment Variables

### Dashboard (.env.local)

Create a `.env.local` file in `schoolable_dashboard`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile App (lib/main.dart or .env)

Update the `Supabase.initialize` call in `lib/main.dart` with your URL and Key.
