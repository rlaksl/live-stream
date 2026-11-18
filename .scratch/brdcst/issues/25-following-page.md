# 팔로잉 페이지

Status: ready-for-agent
Blocked by: 20
출처: 헤더 시안 `docs/design/brdcst-design/Main.dc.html`

## 완료 조건

- [ ] `/following`: 팔로우한 방송자의 방송 중 목록 → 그 방송자들의 최근 방송. 팔로우가 없으면 빈 상태 안내.
- [ ] 비로그인은 `/login?next=/following`.
- [ ] 홈의 "팔로우한 방송자" 섹션은 제거(티켓 13).
- [ ] 헤더 `팔로잉`에서 연결, 크롬 확인(B가 A 팔로우 → 목록에 보임, 언팔로우 → 빠짐).
