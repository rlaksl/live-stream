# BRDCST spec

공모전(`CONTEST.md`) 출품용 실시간 방송 웹 서비스. 용어는 `GLOSSARY.md`, 되돌리기 어려운 결정은 `docs/adr/`를 따른다.
마감 2026-11-19 23:59. 심사는 2026-11-23까지.

## 구현 순서

① 필수 기능 + 배포(01~06) → ② 녹화(07, 2시간 안에 안 되면 보류하고 08·09 먼저) → ③ 댓글(08) → ④ 후원(09) → ⑤ 운영·README·시연(10~11).
단계마다 `main`에 푸시해 Vercel에 배포하고, 언제 멈춰도 제출 가능한 상태를 유지한다.

## 스택

- Next.js(App Router) + TypeScript, Tailwind CSS + shadcn/ui, 어두운 테마, PC·모바일 반응형
- LiveKit Cloud(무료): 송출·시청(`@livekit/components-react`), 웹훅, 녹화(egress)
- Supabase(무료): Postgres, Auth, Storage
- 토스페이먼츠 결제위젯 v2 테스트 모드
- Vercel(Hobby), Vitest

## 데이터 접근 (ADR-0001)

- 브라우저는 Supabase에 직접 접근하지 않는다. 로그인·가입도 서버 액션을 거친다.
- 서버는 `@supabase/ssr` 쿠키 세션으로 로그인 사용자를 확인하고, DB는 서버 전용 키(service role)로 읽고 쓴다.
- 모든 테이블에 RLS를 켜고 정책은 두지 않는다.
- 권한 판단은 기능별 서버 모듈 안의 작은 함수로 둔다. 예: `canEditBroadcast(user, broadcast)`. Vitest로 직접 테스트한다.

## 데이터 모델

코드의 상태 값은 영어, 화면 표기는 한국어(`GLOSSARY.md`).

- `profiles`: `id`(= auth user id), `nickname`(2~12자, unique), `created_at`
- `broadcasts`: `id`, `owner_id`, `title`(1~100자), `description`, `status`(`waiting`=대기 / `live`=방송 중 / `ended`=종료), `record_enabled`, `started_at`, `ended_at`, `created_at`, `updated_at`
  - LiveKit 방 이름은 방송 `id`를 쓴다.
  - 한 사용자의 `live` 방송은 최대 1개. 부분 unique 인덱스로 강제한다.
- `comments`: `id`, `broadcast_id`(방송 삭제 시 함께 삭제), `author_id`, `body`(1~300자), `created_at`, `updated_at`
- `donations`: `id`, `order_id`(unique), `broadcast_id`(방송 삭제 시 null), `donor_id`, `streamer_id`, `amount`(정수, 1,000원 이상), `message`(≤100자), `status`(`pending`=대기 / `confirmed`=확정), `payment_key`(unique), `confirmed_at`, `created_at`
- `recordings`: `id`, `broadcast_id`(방송 삭제 시 함께 삭제 + 저장 파일 삭제), `egress_id`(unique), `status`(`recording` / `ready` / `failed`), `playlist_path`, `started_at`, `ended_at`

## 권한 규칙

| 동작 | 비로그인 | 로그인(다른 사용자) | 방송 소유자 |
| --- | --- | --- | --- |
| 방송 목록·상세·시청·녹화 재생 | 허용 | 허용 | 허용 |
| 방송 등록 | 거절(401) | 허용 | 허용 |
| 방송 수정·삭제 | 거절(401) | 거절(403) | 허용 |
| 방송 시작·종료(송출 제어) | 거절(401) | 거절(403) | 허용 |
| 송출 토큰 발급 | 거절 | 거절 | `방송 중`일 때만 허용 |
| 시청 토큰 발급(구독 전용) | 허용 | 허용 | 허용 |
| 댓글 조회 | 허용 | 허용 | 허용 |
| 댓글 작성 | 거절(401) | 허용 | 허용 |
| 댓글 수정·삭제 | 거절(401) | 작성자만 | 작성자만 |
| 후원 | 거절(401) | 허용 | 거절(자기 방송) |

## LiveKit 토큰

- 토큰은 서버만 발급한다.
- **송출 토큰:** `canPublish: true`. 그 방송의 소유자에게만, 방송 상태가 `live`일 때만 발급한다. `대기` → `방송 중` 전환은 "방송 시작" 요청이 하고, 그 뒤 송출 토큰을 받는다.
- **시청 토큰:** `canPublish: false`, `canSubscribe: true`. 비로그인 시청자는 임의의 identity를 쓴다.
- 방송 종료 시 서버가 LiveKit 방을 삭제해 송출을 끊는다.
- 위 규칙은 Vitest 권한 테스트에 포함한다.

## 방송 상태 동기화

- **종료 버튼:** 상태를 `ended`로 바꾸고, LiveKit 방을 삭제하고, 녹화를 중지한다.
- **LiveKit 웹훅:** `WebhookReceiver`로 서명을 검증한다.
  - 소유자의 `participant_left` 또는 `room_finished`가 오면 `live` 방송을 `ended`로 바꾼다.
  - 순간 끊김은 LiveKit 재연결에 맡긴다. 송출자가 나가면 방은 비게 된다.
- **방송 중 삭제:** 위 종료 처리 뒤 삭제한다.

## 송출 화면

- "방송하기" 화면 하나에서 처리한다.
- **PC:** 화면 공유(`getDisplayMedia`, 오디오 요청) + 마이크. 오디오는 별도 트랙 2개로 보낸다. 탭·시스템 소리는 Chrome·Edge 데스크톱에서만 된다고 화면에 안내한다.
- **모바일(터치 기기):** 카메라 + 마이크만. 전면·후면 전환을 제공한다.
- **녹화 토글:** 기본 꺼짐.

## 녹화 (ADR-0002)

- LiveKit Participant egress를 HLS 조각으로 Supabase Storage(S3 호환)에 저장한다. 무료 요금제에서 S3가 안 되면 Cloudflare R2를 쓴다.
- 녹화 토글을 켠 방송만, 방송 시작 시 egress를 시작한다. 최대 10분이며, 그 뒤 녹화만 중지한다.
- egress 웹훅(`egress_ended`)으로 녹화 상태를 `ready` 또는 `failed`로 바꾼다. 녹화가 실패해도 송출은 계속된다.
- 재생은 `hls.js`로 한다. Safari는 기본 재생을 쓴다.
- LiveKit 녹화 변환 한도는 월 60분이다. 개발 테스트는 1분 내외로 하고, 시연용 녹화 1~2개를 미리 만들어 둔다.
- **확인 필수:** 탭 소리와 마이크 두 오디오 트랙이 모두 녹화되는지 확인한다. 안 되면 방식을 바꿀지 사용자에게 묻는다.

## 댓글

- 방송 상세 화면 옆(모바일은 아래)에 둔다. 2~3초 폴링으로 갱신한다.
- 모든 상태의 방송에 작성할 수 있다.

## 후원 (ADR-0003)

1. 서버가 `pending` 후원을 만든다(금액·방송·후원자·방송자·메시지, `order_id` 발급).
2. 결제위젯으로 결제한다.
3. 성공 리다이렉트를 받으면 서버가 저장된 금액과 비교한 뒤 `POST /v1/payments/confirm`을 호출한다. 성공하면 `pending` → `confirmed`로 바꾼다. 조건부 업데이트라 한 번만 바뀐다.
4. 웹훅 `PAYMENT_STATUS_CHANGED`가 오면 `GET /v1/payments/{paymentKey}`로 다시 조회한다. 상태가 `DONE`이고 금액과 주문이 일치하면 3과 같은 확정 함수를 쓴다.

- 금액은 1,000 / 5,000 / 10,000원 또는 직접 입력(1,000원 이상, 정수)이다. 모든 상태의 방송에 후원할 수 있고, 자기 방송은 거절한다.
- 방송별 확정 후원 내역(닉네임·금액·메시지)과 합계를 보여준다.
- **Vitest:** 금액 불일치는 거절, 같은 통지가 반복돼도 1회만 적립, 자기 방송 후원은 거절.

## 화면

- **메인:** 방송 중(시청자 수) / 전체 방송(최신순) / 다시보기 탭
- **방송 상세:** 상태별로 다르다. `대기`는 졸린 마스코트 + "곧 시작합니다", `방송 중`은 플레이어 + 시청자 수, `종료`는 X 눈 마스코트 + 녹화 바로가기. 댓글과 후원 영역이 함께 있다.
- **로그인:** 테스트 계정 A·B 바로 로그인 버튼
- **로고:** "BRDCST" + 아래 작은 "broadcast". 포인트 색은 앰버 `#FF8A1F` 계열이고, 형광 초록은 쓰지 않는다.
- **마스코트:** 하나의 캔버스 컴포넌트에서 표정(`happy`/`sleepy`/`dead`)과 크기, 튀는 동작 여부만 바꾼다. 노이즈는 굵은 픽셀로 코드에서 생성하고 가끔 마젠타·시안 글리치를 섞는다. 얼굴은 항상 노이즈 앞에 그린다.

## 운영

- **Supabase 일시중지 방지:** Vercel 크론으로 하루 1회 `/api/cron/keepalive`를 호출해 DB를 조회한다. `CRON_SECRET`으로 보호한다.
- **환경변수:** `.env.example`에 키 이름만 둔다. 실제 값은 Vercel 환경변수와 로컬 `.env.local`(git 제외)에 둔다.
