# Supabase 일시중지 방지 크론

Status: ready-for-agent
Blocked by: 01

Vercel 크론 하루 1회 → `/api/cron/keepalive`가 DB를 간단히 조회.

## 완료 조건

- [ ] `vercel.json` 크론 등록
- [ ] `CRON_SECRET` 없거나 틀리면 401
- [ ] 배포 후 수동 호출로 200 확인
