# 요구사항 체크리스트 — 구현 근거와 코드 위치

공모전 체크리스트(8절) 항목별로 구현 내용, 관련 코드, 확인 방법을 정리했습니다. 코드밋 제출 시 '충족' 근거로 사용합니다.
경로는 저장소 루트 기준이며, 확인 절차는 [README](../README.md#기능-확인-방법)를 따릅니다.

## 기본

### 소스에 문법 오류가 없다

- `npm run typecheck`(TypeScript strict), `npm run lint`(ESLint), `npm run build`, `npm test`(Vitest)가 통과합니다.
- `main`에 푸시할 때마다 Vercel이 빌드·배포합니다.

## PC 방송

### PC 화면을 캡처하여 실시간으로 송출한다

- 송출 화면에서 `화면 공유`를 고르면 `getDisplayMedia` 기반의 `createLocalScreenTracks`로 화면 영상 트랙을 만들고 LiveKit 방에 `publishTrack`합니다.
- 코드: `src/features/live/studio.tsx` (`preview` → `createLocalScreenTracks`, `goLive` → `publishTrack`), 화면 공유 가능 여부 판별 `useCanShareScreen`
- 시청: `src/features/live/live-player.tsx` (`@livekit/components-react`로 구독·재생)

### 탭 소리 또는 시스템 소리와 마이크 음성을 함께 송출한다 / 마이크 음성을 함께 송출한다

- 화면 공유를 `audio: true, systemAudio: "include"`로 요청해 탭·시스템 소리 트랙을 받고, 마이크 트랙(`createLocalAudioTrack`)을 따로 만들어 **오디오 트랙 2개를 함께** 송출합니다. 송출 화면에 화면·탭 소리·마이크 트랙 상태를 각각 표시합니다.
- Chrome·Edge 데스크톱에서만 탭 소리를 지원한다는 안내를 화면에 표시합니다.
- 코드: `src/features/live/studio.tsx` (`preview`, 트랙 상태 `Indicator`, `toggleMic`)
- 확인: 녹화 결과에 탭 소리(1000Hz)와 마이크(440Hz) 테스트 음이 모두 들어간 것을 확인했습니다(녹화는 방송자의 모든 오디오 트랙을 섞음).

### 방송 시작과 종료 시 송출 연결을 생성하고 종료한다

- 시작: 서버 액션 `startBroadcast`가 소유자·`대기` 상태를 확인하고 `방송 중`으로 바꾼 뒤, `getPublishConnection`이 송출 토큰(`canPublish: true`)을 발급해 LiveKit에 연결합니다.
- 종료: `endBroadcast` → `endLive`가 상태를 `종료`로 바꾸고 녹화를 멈춘 뒤 **LiveKit 방을 삭제해 송출·시청 연결을 끊습니다.**
- 코드: `src/features/live/actions.ts` (`startBroadcast`, `endBroadcast`, `getPublishConnection`), `src/features/live/end-live.ts` (`endLive`), `src/features/live/token.ts` (`createLiveToken`)

## 모바일 방송

### 휴대폰 카메라 영상과 마이크 음성을 함께 실시간 송출한다 / 휴대폰 마이크 음성을 함께 송출한다

- 터치 기기(`pointer: coarse`)이거나 화면 공유를 지원하지 않으면 `카메라` 소스가 기본입니다. `createLocalVideoTrack`(카메라) + `createLocalAudioTrack`(마이크)을 송출합니다.
- 방송 중 전면·후면 카메라 전환(`restartTrack({ facingMode })`)과 마이크 끄기/켜기를 제공합니다.
- 코드: `src/features/live/studio.tsx` (`preview`, `flipCamera`, `toggleMic`)

### 모바일에서 방송을 시작하고 종료한다

- PC와 같은 송출 화면·서버 액션을 사용합니다(`startBroadcast` / `endBroadcast`). 반응형 레이아웃으로 휴대폰에서 등록·시작·종료가 가능합니다.

## 방송 관리

### 방송 제목 등 방송 정보를 등록, 조회, 수정, 삭제한다

- 등록·수정·삭제 서버 액션: `src/features/broadcasts/actions.ts` (`createBroadcast`, `updateBroadcast`, `deleteBroadcast`). 제목 1~100자, 설명 선택(zod 검증).
- 조회: `src/features/broadcasts/queries.ts` (`listBroadcasts`, `findBroadcast`)
- 화면: `src/app/broadcasts/new/page.tsx`, `src/app/broadcasts/[id]/edit/page.tsx`, `src/features/broadcasts/broadcast-form.tsx`, `src/features/broadcasts/delete-button.tsx`
- 방송 중 삭제는 `endLive`로 송출을 끊은 뒤 삭제합니다.

### 방송 목록과 상세 화면, PC·모바일에서 송출한 방송을 각각 다른 기기에서 수신·재생

- 메인 탭: 방송 중(시청자 수) / 전체 방송(최신순) / 다시보기 — `src/app/page.tsx`, 시청자 수 `src/features/live/viewer-counts.ts`
- 상세: 상태별 화면(대기·방송 중·종료) — `src/app/broadcasts/[id]/page.tsx`
- 시청: 로그인 없이 구독 전용 토큰(`getViewerConnection`)으로 재생 — `src/features/live/live-player.tsx`

### 방송 중과 종료 상태를 관리하고 방송 종료 시 송출을 중단한다

- 상태는 `waiting`(대기) → `live`(방송 중) → `ended`(종료) 순서로만 바뀌며, 각 전환은 현재 상태를 조건으로 한 업데이트라 중복 요청에도 한 번만 일어납니다. 사용자당 `방송 중`은 1개(부분 unique 인덱스 `broadcasts_one_live_per_owner`).
- 종료 버튼 외에도 방송자가 탭을 닫거나 연결이 끊기면 **LiveKit 웹훅**(`participant_left`/`room_finished`, 서명 검증)으로 서버가 `종료` 처리합니다.
- 송출 토큰은 `방송 중`일 때만 발급되어, 종료된 방송에는 다시 송출할 수 없습니다.
- 코드: `src/features/broadcasts/policy.ts` (`assertCanStart`, `assertCanEnd`, `assertCanPublish`), `src/features/live/end-live.ts`, `src/app/api/livekit/webhook/route.ts`, `supabase/migrations/0001_init.sql`

### 방송 정보를 영구 저장하고 서버 재시작 후에도 조회한다

- Supabase Postgres의 `broadcasts` 테이블에 저장합니다. 앱 서버(Vercel 서버리스)는 상태를 메모리에 두지 않으므로 재배포·재시작 후에도 같은 데이터를 조회합니다.
- 코드: `supabase/migrations/0001_init.sql`, `src/features/broadcasts/queries.ts`
- 무료 요금제 일시중지 방지: 매일 `/api/cron/keepalive` 호출 — `vercel.json`, `src/app/api/cron/keepalive/route.ts`

## 인증

### 회원가입, 로그인, 로그아웃 및 인증 상태 관리

- 이메일·비밀번호·닉네임(2~12자, 중복 불가) 가입, 로그인, 로그아웃을 서버 액션으로 처리하고, Supabase Auth 세션을 HTTP-only 쿠키로 관리합니다. 요청마다 `src/proxy.ts`가 세션을 갱신합니다.
- 모든 기능은 `getCurrentUser` 하나로 로그인 사용자를 확인합니다.
- 평가용 테스트 계정 A/B 바로 로그인 버튼(`signInAsTestAccount`)을 제공합니다.
- 코드: `src/features/auth/actions.ts` (`signUp`, `signIn`, `signInAsTestAccount`, `signOut`), `src/features/auth/current-user.ts`, `src/components/site-header.tsx`

### 비로그인도 조회·시청 가능, 방송 등록과 송출은 로그인한 사용자만

- 목록·상세·시청 토큰(구독 전용)은 로그인 없이 허용합니다(`assertCanWatch`).
- 등록은 `requireUser`(401), 송출 토큰은 소유자 + `방송 중`(`assertCanPublish`)만 허용합니다.
- 코드: `src/features/broadcasts/actions.ts`, `src/features/broadcasts/policy.ts`, `src/features/live/actions.ts`
- 테스트: `src/features/broadcasts/policy.test.ts`, `src/features/live/token.test.ts` — 비로그인/다른 사용자/소유자 × 대기/방송 중/종료 조합별 허용·거절

### 방송 수정, 삭제 및 송출 제어 시 서버에서 소유자 권한을 검증

- 수정·삭제·시작·종료·송출 토큰·녹화 시작/중지 서버 액션이 모두 `src/features/broadcasts/policy.ts`의 함수(`assertOwner` 등)를 거칩니다. 비로그인 401, 다른 사용자 403.
- 브라우저는 DB에 직접 접근하지 않고 앱 서버만 서버 전용 키로 읽고 씁니다(RLS 켜고 정책 없음) — [ADR-0001](adr/0001-server-only-data-access.md)
- 테스트: `src/features/broadcasts/policy.test.ts`

## 댓글 (선택)

### 로그인한 사용자가 방송별 댓글을 작성, 조회, 수정, 삭제

- 조회는 누구나(`GET /api/broadcasts/[id]/comments`, 2.5초 폴링), 작성은 로그인 사용자, 본문 1~300자.
- 코드: `src/features/comments/actions.ts` (`createComment`, `updateComment`, `deleteComment`), `src/features/comments/queries.ts`, `src/features/comments/comment-panel.tsx`, `src/app/api/broadcasts/[id]/comments/route.ts`

### 댓글 수정 및 삭제 시 서버에서 작성자 권한 검증

- `assertCommentAuthor`: 비로그인 401, 작성자가 아니면 403.
- 코드: `src/features/comments/policy.ts`, 테스트 `src/features/comments/policy.test.ts`

## 도네이션 (선택)

### 로그인한 사용자가 후원 대상과 금액을 선택하고 테스트 결제를 요청

- 방송 상세의 **후원하기** → 금액(1,000/5,000/10,000원 또는 직접 입력 1,000원 이상)과 메시지(100자 이하) 선택 → 토스페이먼츠 결제창(테스트 모드, 카드·간편결제 통합결제창).
- 후원 대상은 선택한 방송의 방송자이며, 서버가 방송에서 정해 저장합니다(클라이언트가 바꿀 수 없음). 비로그인 401, 자기 방송 403(`assertCanDonate`).
- 결제 전에 서버가 `대기` 후원(주문번호·금액·방송·후원자·방송자·메시지)을 저장합니다(`createDonation`).
- 코드: `src/features/donations/donate-form.tsx`, `src/features/donations/actions.ts`, `src/features/donations/policy.ts`, `src/app/broadcasts/[id]/donate/page.tsx`

### 서버에서 결제 승인 결과, 금액, 후원 대상을 검증하고 후원 내역 저장

- 결제 성공 리다이렉트(`/donations/success`): 주문번호로 저장된 후원을 찾고(후원 대상 포함), **저장된 금액과 결제 금액이 다르면 거절**한 뒤 토스 승인 API(`POST /v1/payments/confirm`)를 호출해 성공하면 `확정`합니다.
- 웹훅(`/api/toss/webhook`): 웹훅 내용을 믿지 않고 `GET /v1/payments/{paymentKey}`로 다시 조회해 상태가 `DONE`이고 주문·금액이 일치할 때만 같은 확정 함수로 확정합니다. 조회 실패는 502를 돌려 토스가 재전송하게 합니다.
- 코드: `src/features/donations/confirm.ts` (`confirmDonation`), `src/features/donations/toss.ts`, `src/app/donations/success/page.tsx`, `src/app/api/toss/webhook/route.ts`, [ADR-0003](adr/0003-donation-confirmed-by-server-lookup.md)
- 테스트: `src/features/donations/confirm.test.ts` (금액 불일치 거절, 없는 주문 404), `src/features/donations/policy.test.ts` (자기 방송·비로그인 거절, 금액·메시지 검증)

### 중복 승인 통지에 따른 중복 적립 방지, 방송별 후원 내역과 합계 조회

- `대기 → 확정`은 `status = 'pending'` 조건부 업데이트로 한 번만 일어나고, `payment_key`·`order_id`에 고유 제약이 있습니다. 이미 확정된 후원은 승인 API를 다시 부르지 않습니다.
- 방송별 확정 후원 내역(닉네임·금액·메시지)과 합계: `listDonations`, `GET /api/broadcasts/[id]/donations`(5초 폴링), `src/features/donations/donation-panel.tsx`
- 테스트: `confirm.test.ts` — 리다이렉트 1회 + 웹훅 여러 번이 동시·반복으로 들어와도 확정 1회, 합계 1회 적립
- 배포 환경 확인(2026-11-18):
  - 카카오페이 1,000원 실제 테스트 결제: 토스 API 로그 `/v1/payments/confirm` 200, 웹훅 `PAYMENT_STATUS_CHANGED` 전송 성공. 토스에 웹훅 주소가 2개 등록되어 같은 통지를 중복으로 받을 수 있는 상태에서 DB는 `확정` 1건, 방송 합계 1,000원.
  - 결제 완료(DONE) 후 `대기`로 남은 주문에 웹훅 요청 3개를 동시에 보냄 → 토스 재조회로 확정, 합계는 1,000원만 증가.
  - 금액을 바꾼 성공 URL → "결제 금액이 후원 금액과 다릅니다"로 거절. 존재하지 않는 결제 키의 웹훅 → 확정되지 않음.

## 녹화 (선택)

### 라이브 방송을 녹화 영상으로 저장

- 송출 화면의 **녹화하기**(기본 꺼짐)를 켠 방송만 방송 시작 시 LiveKit egress(방송자 영상 + 모든 오디오 트랙 믹스)를 시작해 HLS 조각을 Supabase Storage(S3 호환)에 저장합니다. 최대 10분 뒤 녹화만 중지하고 방송은 계속됩니다.
- `egress_ended` 웹훅으로 `ready`/`failed`를 기록하고, 웹훅이 없을 때는 화면 표시 시 LiveKit에 직접 조회합니다. 녹화가 실패해도 송출은 계속됩니다.
- 코드: `src/features/recordings/egress.ts` (`startRecording`, `stopRecording`, `finishRecording`, `syncRecording`), `src/features/recordings/actions.ts`, `src/features/live/studio.tsx` (녹화 토글, 10분 타이머), [ADR-0002](adr/0002-recording-as-hls-segments.md)

### 녹화 영상 목록과 상세 조회 및 재생

- 메인 **다시보기** 탭(목록), `/recordings/[id]`(상세·재생). `hls.js`로 재생하고 Safari는 기본 HLS 재생을 씁니다.
- 코드: `src/features/recordings/queries.ts`, `src/features/recordings/recording-card.tsx`, `src/features/recordings/replay-player.tsx`, `src/app/recordings/[id]/page.tsx`

### 영상 정보와 저장 위치를 영구 저장

- `recordings` 테이블에 방송·egress id·상태·재생 목록 경로(`playlist_path`)·시작/종료 시각을 저장합니다. 방송을 삭제하면 녹화 행과 저장 파일도 삭제합니다(`deleteRecordingFiles`).
- 코드: `supabase/migrations/0001_init.sql`, `supabase/migrations/0003_recordings_bucket.sql`, `src/features/recordings/egress.ts`
