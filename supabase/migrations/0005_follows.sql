-- 팔로우: 사용자(follower)가 방송자(broadcaster)를 팔로우한다. 자기 자신은 팔로우할 수 없다.
create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  broadcaster_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, broadcaster_id),
  check (follower_id <> broadcaster_id)
);

create index follows_broadcaster on follows (broadcaster_id);

-- 다른 테이블과 같이 브라우저는 직접 접근하지 않고 앱 서버(service_role)만 읽고 쓴다. (docs/adr/0001)
alter table follows enable row level security;
grant select, insert, delete on follows to service_role;
notify pgrst, 'reload schema';
