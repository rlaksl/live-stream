# Supabase 일시중지 방지 크론

Status: resolved
Blocked by: 01

Vercel 크론 하루 1회 → `/api/cron/keepalive`가 DB를 간단히 조회.

## 완료 조건

- [x] `vercel.json` 크론 등록
- [x] `CRON_SECRET` 없거나 틀리면 401
- [x] 배포 후 수동 호출로 200 확인

## Comments

- 2026-11-18: `vercel.json` 크론 매일 18:00 UTC(03:00 KST) → `/api/cron/keepalive`가 broadcasts 개수를 조회. `Authorization: Bearer CRON_SECRET` 아니면 401, 비밀값 미설정이면 항상 401 (route.test.ts).
- 배포 확인: 헤더 없음 401, 틀린 값 401, 올바른 값 200 `{"ok":true,"broadcasts":3}`.
- 같은 날 `vercel.json`에 `regions: ["icn1"]` 추가(토스 API 키 접근 정책이 대한민국만 허용). 응답 헤더 `x-vercel-id: icn1::icn1::…`로 서울 실행 확인.
