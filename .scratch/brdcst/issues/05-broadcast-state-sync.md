# 방송 상태 자동 동기화 (LiveKit 웹훅)

Status: ready-for-agent
Blocked by: 04

방송자가 종료 버튼 없이 나가도 방송이 `종료`가 되게 한다.

## 완료 조건

- [ ] `/api/livekit/webhook`이 서명을 검증한다 (`WebhookReceiver`)
- [ ] 소유자 `participant_left`/`room_finished` → `live` 방송을 `ended`로
- [ ] `방송 중` 방송 삭제 시 종료 처리 후 삭제
- [ ] 탭을 닫으면 잠시 뒤 목록·상세에서 종료로 보인다
