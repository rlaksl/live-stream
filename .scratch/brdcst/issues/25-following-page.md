# 팔로잉 페이지

Status: done
Blocked by: 20
출처: 헤더 시안 `docs/design/brdcst-design/Main.dc.html`

## 완료 조건

- [x] `/following`: 팔로우한 방송자의 방송 중 목록 → 그 방송자들의 최근 방송. 팔로우가 없으면 빈 상태 안내.
- [x] 비로그인은 `/login?next=/following`.
- [x] 홈의 "팔로우한 방송자" 섹션은 제거(티켓 13).
- [x] 헤더 `팔로잉`에서 연결, 크롬 확인(B가 A 팔로우 → 목록에 보임, 언팔로우 → 빠짐).

## Comments

- 2026-11-19: `/following`(비로그인 → `/login?next=/following`), `listBroadcastsByOwners`. 홈의 팔로우 섹션 제거, 헤더에 `팔로잉`.
- 크롬 확인: 비로그인 → 로그인 → 복귀, B 빈 상태(0명) → A 방송에서 팔로우 → 1명, A의 대기·종료 방송이 "최근 방송"에 보임. 언팔로우 확인은 마이페이지(26)에서. B→A 팔로우 1건은 남겨 둠(마이페이지 확인용, 데이터 삭제 금지).
