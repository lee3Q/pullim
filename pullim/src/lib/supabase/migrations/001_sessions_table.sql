-- sessions 테이블
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  theme text not null,
  summary text,
  turn_count integer default 0,
  cheat_count integer default 0,
  messages_count integer default 0,
  entry_mode text default 'concern',
  created_at timestamptz default now()
);

-- RLS
alter table public.sessions enable row level security;

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- 인덱스
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_created_at on public.sessions(created_at desc);
