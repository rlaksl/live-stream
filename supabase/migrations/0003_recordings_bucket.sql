-- 녹화(HLS 조각) 저장 버킷. 다시보기는 로그인 없이 볼 수 있어야 하므로 공개 버킷이다.
-- 업로드는 LiveKit egress가 S3 액세스 키로, 삭제는 앱 서버가 service role로만 한다.
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do update set public = true;
