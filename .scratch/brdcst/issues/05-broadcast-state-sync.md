# 방송 상태 자동 동기화 (LiveKit 웹훅)

Status: resolved
Blocked by: 04

방송자가 종료 버튼 없이 나가도 방송이 `종료`가 되게 한다.

## 완료 조건

- [x] `/api/livekit/webhook`이 서명을 검증한다 (`WebhookReceiver`)
- [x] 소유자 `participant_left`/`room_finished` → `live` 방송을 `ended`로
- [x] `방송 중` 방송 삭제 시 종료 처리 후 삭제
- [x] 탭을 닫으면 잠시 뒤 목록·상세에서 종료로 보인다

## Comments

- 2026-11-18: 코드 완료. 웹훅은 배포 주소 등록 후에만 확인 가능(탭 닫기 → 종료).
- 2026-11-18 사용자 실기기 확인(배포 주소): 송출 탭을 닫으면 LiveKit 웹훅으로 자동 종료. 완료.
