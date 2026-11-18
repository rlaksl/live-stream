-- BRDCST 초기 스키마
-- 모든 테이블은 RLS를 켜고 정책을 두지 않는다. 앱 서버만 service role 키로 접근한다. (docs/adr/0001)

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 12),
  created_at timestamptz not null default now()
);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  status text not null default 'waiting' check (status in ('waiting', 'live', 'ended')),
  record_enabled boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 한 사용자의 방송 중인 방송은 최대 1개
create unique index broadcasts_one_live_per_owner on broadcasts (owner_id) where status = 'live';
create index broadcasts_status_created_at on broadcasts (status, created_at desc);

create table comments (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references broadcasts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_broadcast_created_at on comments (broadcast_id, created_at);

create table donations (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  -- 방송이 삭제되어도 결제 기록은 남긴다
  broadcast_id uuid references broadcasts (id) on delete set null,
  donor_id uuid not null references profiles (id),
  streamer_id uuid not null references profiles (id),
  amount integer not null check (amount >= 1000),
  message text not null default '' check (char_length(message) <= 100),
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  payment_key text unique,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index donations_broadcast_status on donations (broadcast_id, status);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references broadcasts (id) on delete cascade,
  egress_id text not null unique,
  status text not null default 'recording' check (status in ('recording', 'ready', 'failed')),
  playlist_path text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index recordings_broadcast on recordings (broadcast_id);

alter table profiles enable row level security;
alter table broadcasts enable row level security;
alter table comments enable row level security;
alter table donations enable row level security;
alter table recordings enable row level security;
