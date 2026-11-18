# 평가용 로그인 표시·복귀 경로

Status: ready-for-agent
출처: `../review-1118.md` 3절 (주장 확인 #5, #6)

## 완료 조건

- [ ] A/B 버튼 누르면 `로그인 중…`, 실패하면 이유 표시.
- [ ] `safeRedirect`가 `/\evil.com` 같은 경로도 막는다. 테스트 추가.
