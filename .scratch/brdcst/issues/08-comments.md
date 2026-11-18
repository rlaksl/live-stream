# 댓글

Status: resolved
Blocked by: 03

방송별 댓글 작성·조회·수정·삭제. 상세 화면 옆(모바일은 아래), 2~3초 폴링.

## 완료 조건

- [x] 조회는 누구나, 작성은 로그인 사용자, 수정·삭제는 작성자만 (401/403)
- [x] 본문 1~300자, 작성자 닉네임·시각 표시
- [x] Vitest: 비로그인/작성자/다른 사용자별 작성·수정·삭제 허용·거절

## Comments

- 2026-11-18: 권한은 features/comments/policy.ts(+test). 목록은 GET /api/broadcasts/[id]/comments를 2.5초 폴링.
- 로컬 E2E: A 작성 → B 폴링 수신, B 화면에 A 댓글의 수정·삭제 버튼 없음, 비로그인은 목록만 + 로그인 링크, A 수정·삭제가 B에 반영. 방송 삭제 시 댓글 cascade 삭제 확인.
