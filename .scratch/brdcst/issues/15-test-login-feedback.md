# 평가용 로그인 표시·복귀 경로

Status: done
출처: `../review-1118.md` 3절 (주장 확인 #5, #6)

## 완료 조건

- [x] A/B 버튼 누르면 `로그인 중…`, 실패하면 이유 표시.
- [x] `safeRedirect`가 `/\evil.com` 같은 경로도 막는다. 테스트 추가.

## Comments

- 2026-11-19: `safeRedirect`를 `src/features/auth/safe-redirect.ts`로 옮기고 테스트 추가(`//`, `/\`, 외부 주소 → 홈).
- 크롬 확인: A 버튼 클릭 시 `로그인 중…` 표시, `next=/broadcasts/new`는 그대로 이동, `next=/\evil.com`·`//evil.com`은 홈으로.
- 실패 문구 표시는 실패 상황을 재현하기 어려워 코드로만 확인(서버 액션이 돌려준 `{ error }`를 버튼 아래에 표시).
