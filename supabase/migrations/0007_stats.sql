-- 마이페이지 통계: 방송별 최고 시청자 수와 다시보기 재생 수. 이 시점부터 기록한다(과거 값·가짜 값 없음).
alter table broadcasts add column peak_viewers integer not null default 0;
alter table recordings add column play_count integer not null default 0;

-- 동시에 여러 요청이 와도 값이 줄어들거나 빠지지 않도록 DB에서 한 번에 갱신한다.
create function record_peak_viewers(p_broadcast_id uuid, p_viewers integer) returns void
language sql as $$
  update broadcasts set peak_viewers = greatest(peak_viewers, p_viewers) where id = p_broadcast_id;
$$;

create function increment_recording_play(p_recording_id uuid) returns void
language sql as $$
  update recordings set play_count = play_count + 1 where id = p_recording_id;
$$;

revoke execute on function record_peak_viewers(uuid, integer) from public, anon, authenticated;
revoke execute on function increment_recording_play(uuid) from public, anon, authenticated;
grant execute on function record_peak_viewers(uuid, integer) to service_role;
grant execute on function increment_recording_play(uuid) to service_role;
