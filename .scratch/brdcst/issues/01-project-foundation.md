# 프로젝트 기반과 첫 배포

Status: ready-for-human

Next.js(App Router)+TypeScript+Tailwind+shadcn/ui 프로젝트를 만들고, 어두운 테마 기본 레이아웃(헤더 로고 자리 포함)과 Supabase 스키마, Vercel 배포까지 연결한다.

## 할 일

- 프로젝트 생성, 기능별 폴더 구조, Vitest 설정
- 어두운 테마 토큰(앰버 포인트 색), 헤더·본문 기본 레이아웃
- Supabase 프로젝트 생성(사용자), 스키마 마이그레이션 SQL(`supabase/migrations/`): profiles, broadcasts, comments, donations, recordings, RLS 켜기
- **Supabase Storage S3 업로드 가능 여부 즉시 확인 → R2 전환 여부 결정**
- `.env.example`, 서버 전용 Supabase 클라이언트
- GitHub 저장소를 Vercel에 연결해 첫 배포

## 완료 조건

- [ ] Vercel 주소에서 빈 메인 화면이 뜬다
- [x] 마이그레이션 SQL로 테이블이 만들어진다
- [x] `npm test`, `npm run build`가 통과한다
- [x] S3 가능 여부와 녹화 저장소 결정이 spec에 기록된다 (Supabase S3 사용, R2 미사용)

## Comments

- 2026-11-18: Vercel 연결(사용자 작업)만 남음. 0002에서 service_role GRANT 추가(새 테이블이 Data API에 자동 노출되지 않음).
