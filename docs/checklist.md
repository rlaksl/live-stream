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

- 화면 공유를 `audio: true, systemAudio: "include"`로 요청해 탭·시스템 소리 트랙을 받고, 마이크 트랙(`createLocalAudioTrack`)을 따로 만들어 **오디오 트랙 2개를 함께** 송출합니다. 송출 화면에 화면·공유 소리·마이크 장치 상태 3칸을 각각 표시하고, 공유 소리가 없으면 형광펜 안내와 **다시 고르기**(`resetPreview`)를 보여줍니다.
- Chrome·Edge 데스크톱에서만 탭 소리를 지원한다는 안내를 화면에 표시합니다.
- 코드: `src/features/live/studio.tsx` (`preview`, 장치 상태 `DeviceStatus`, `resetPreview`, `toggleMic`)
- 확인: 녹화 결과에 탭 소리(1000Hz)와 마이크(440Hz) 테스트 음이 모두 들어간 것을 확인했습니다(녹화는 방송자의 모든 오디오 트랙을 섞음).

### 방송 시작과 종료 시 송출 연결을 생성하고 종료한다

- 시작: 서버 액션 `startBroadcast`가 소유자·`대기` 상태를 확인하고 `방송 중`으로 바꾼 뒤, `getPublishConnection`이 송출 토큰(`canPublish: true`)을 발급해 LiveKit에 연결합니다.
- 시작 실패: LiveKit 연결·트랙 전송이 실패하면 `cancelStart`가 상태를 `대기`로 되돌린 뒤 연결을 끊고 장치를 정리합니다. 같은 화면에서 다시 시작할 수 있습니다. 되돌리기 자체가 실패하면 화면만 `대기`로 바꾸지 않고 서버의 실제 상태를 다시 읽어 표시하며 "시작 상태 복구에 실패했습니다. 상태를 다시 확인해 주세요."를 안내합니다(`revertFailedStart`, 테스트 `src/features/live/start-recovery.test.ts`). 두 탭이 동시에 시작하면 상태를 먼저 바꾼 탭만 송출로 넘어가고 다른 탭은 409를 받습니다.
- 종료: `endBroadcast` → `endLive`가 상태를 `종료`로 바꾸고 녹화를 멈춘 뒤 **LiveKit 방을 삭제해 송출·시청 연결을 끊습니다.** 방이 이미 없으면(404 `not_found`) 정상으로 보고, 그 밖의 삭제 실패는 숨기지 않고 알립니다(방송자 이탈 웹훅이 다시 삭제를 시도). 테스트 `src/features/live/external-failures.test.ts`.
- 코드: `src/features/live/actions.ts` (`startBroadcast`, `cancelStart`, `endBroadcast`, `getPublishConnection`), `src/features/live/studio.tsx` (`goLive`), `src/features/live/end-live.ts` (`endLive`), `src/features/live/token.ts` (`createLiveToken`)

## 모바일 방송

### 휴대폰 카메라 영상과 마이크 음성을 함께 실시간 송출한다 / 휴대폰 마이크 음성을 함께 송출한다

- 미리보기에서 화면·카메라를 얻은 뒤 마이크 권한이 거부되면, 먼저 얻은 트랙도 모두 멈춥니다(카메라 표시등·화면 공유가 남지 않음).
- 터치 기기(`pointer: coarse`)이거나 화면 공유를 지원하지 않으면 `카메라` 소스가 기본입니다. `createLocalVideoTrack`(카메라) + `createLocalAudioTrack`(마이크)을 송출합니다.
- 방송 중 전면·후면 카메라 전환(`restartTrack({ facingMode })`)과 마이크 끄기/켜기를 제공합니다.
- 카메라는 여러 화질 동시 전송(simulcast)을 끄고 **720p 한 줄기**(`VideoPresets.h720`)로 송출합니다(휴대폰 부담을 줄임). 화면 공유는 기본 simulcast를 유지합니다. 코드: `src/features/live/studio.tsx` (`goLive`의 `publishTrack` 옵션)
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

- 홈: 대표 영상 캐러셀(방송 중 → 최근 다시보기, 화살표·점) + 소개 패널(내 방송 시작) → 카테고리 칩 → 방송 중(시청자 수, 없으면 놀란 눈 마스코트 빈 상태) → 최근 다시보기(실제 녹화 프레임 썸네일) — `src/app/page.tsx`, `src/features/home/featured-carousel.tsx`, `src/features/broadcasts/category-chips.tsx`. 전체 방송(최신순, 카테고리 필터) `src/app/broadcasts/page.tsx`, 카테고리 목록 `src/features/broadcasts/types.ts`(DB check 제약 `supabase/migrations/0004_broadcast_category.sql`), 시청자 수 `src/features/live/viewer-counts.ts`(LiveKit 조회가 실패해도 카드는 시청자 수 없이 표시)
- 상세: 상태별 화면(대기·방송 중·종료), 방송자 정보와 팔로워 수, 옆(모바일은 아래)에 후원 합계·댓글 — `src/app/broadcasts/[id]/page.tsx`, `src/features/broadcasts/watch-aside.tsx`
- 시청: 로그인 없이 구독 전용 토큰(`getViewerConnection`)으로 재생 — `src/features/live/live-player.tsx`

### 방송 중과 종료 상태를 관리하고 방송 종료 시 송출을 중단한다

- 상태는 `waiting`(대기) → `live`(방송 중) → `ended`(종료) 순서로만 바뀌며, 각 전환은 현재 상태를 조건으로 한 업데이트라 중복 요청에도 한 번만 일어납니다. 사용자당 `방송 중`은 1개(부분 unique 인덱스 `broadcasts_one_live_per_owner`).
- 종료 버튼 외에도 방송자가 탭을 닫거나 연결이 끊기면 **LiveKit 웹훅**(`participant_left`/`room_finished`, 서명 검증)으로 서버가 `종료` 처리합니다.
- 송출 토큰은 `방송 중`일 때만 발급되어, 종료된 방송에는 다시 송출할 수 없습니다.
- 확인(2026-11-19, 배포 환경, 크롬 가짜 카메라·마이크로 송출하고 비로그인 브라우저로 시청): **종료 버튼 / 브라우저 공유 중지(영상 트랙 종료) / 송출 탭 닫기** 세 경우 모두 시청 화면이 약 1.3초 만에 `방송이 종료되었습니다`로 바뀌었고, 홈의 방송 중에서 빠졌으며, 새로고침 후에도 유지되었습니다.
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
- 확인(2026-11-19, 배포 환경): A가 만든 방송(방송 중)을 B가 시청 가능, 수정·송출 화면 주소는 방송 상세로 돌려보냄. A의 화면에서 로그인 쿠키만 B로 바꿔 서버 액션을 직접 요청하자 **수정·삭제·송출 토큰·종료 모두 `권한이 없습니다.`(403)** 로 거부. 이후 A로 다시 조회한 제목·상태(`방송 중`)가 그대로였습니다.

## 댓글 (선택)

### 로그인한 사용자가 방송별 댓글을 작성, 조회, 수정, 삭제

- 조회는 누구나(`GET /api/broadcasts/[id]/comments`, 2.5초 폴링), 작성은 로그인 사용자, 본문 1~300자.
- 메시지가 있는 확정 후원은 댓글 사이에 시간순으로 섞어 **형광펜 닉네임 + "N원 후원"** 으로 구분해 보여주며, 수정·삭제 버튼이 없습니다(`mergeFeed`).
- 코드: `src/features/comments/actions.ts` (`createComment`, `updateComment`, `deleteComment`), `src/features/comments/queries.ts`, `src/features/comments/comment-panel.tsx`, `src/features/comments/feed.ts`, `src/app/api/broadcasts/[id]/comments/route.ts`. 테스트: `src/features/comments/feed.test.ts`

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

### 후원 알림

- 시청 화면과 송출 화면이 4초마다 확정 후원을 불러와, **페이지를 연 뒤 새로 들어온 후원만**(`pickNewDonations`) 차례로 5초씩 배너로 보여줍니다. 첫 응답은 "이미 본 것"으로만 기록해 새로고침 때 지난 후원이 다시 뜨지 않습니다.
- 배너가 뜰 때 Web Audio로 만든 효과음 뒤에 브라우저 내장 음성(`speechSynthesis`)이 "닉네임님 N원 후원"을 읽습니다. 한국어 음성이 없으면 효과음·배너만 나옵니다. 브라우저 정책상 화면을 한 번 누른 뒤에 소리가 납니다.
- **후원 음성** 켜기/끄기는 이 브라우저에만 기억합니다(`localStorage`, 막혀 있으면 켜짐).
- 코드: `src/features/donations/donation-alert.tsx`, `src/features/donations/new-donations.ts`. 테스트: `src/features/donations/new-donations.test.ts`
- 확인(2026-11-19): 브라우저에서 후원 API 응답만 바꿔 새 후원을 흉내 내(DB·결제 없음) 1440·390px에서 배너 표시, 음성 문구, 5초 뒤 사라짐을 확인했습니다. 실제 결제 후 알림은 실기기 확인 대상입니다.

## 녹화 (선택)

### 라이브 방송을 녹화 영상으로 저장

- 송출 화면의 **녹화하기**(기본 꺼짐)를 켠 방송만 방송 시작 시 LiveKit egress(방송자 영상 + 모든 오디오 트랙 믹스)를 시작해 HLS 조각을 Supabase Storage(S3 호환)에 저장합니다. 최대 10분 뒤 녹화만 중지하고 방송은 계속됩니다.
- 녹화 영상은 방송자가 **실제로 화면 공유 중이면 화면, 아니면 카메라**를 씁니다(`startRecording`이 송출 중인 트랙을 확인해 `preferScreenShare`를 정함). 이 옵션을 항상 켜 두었을 때 카메라 방송 녹화가 소리만 있고 영상이 검게 저장됐습니다(ffprobe: 영상 프레임 약 50바이트·밝기 16). 2026-11-19 PC 크롬 가짜 카메라로 재현(수정 전 검정) → 수정 후 프레임 약 5KB, 다시보기에서 카메라 화면 재생 확인.
- `egress_ended` 웹훅으로 `ready`/`failed`를 기록하고(배포 환경 확인 2026-11-19: 서명된 `egress_ended`는 200, 서명 없는 요청은 401), 웹훅이 없을 때는 화면 표시 시 LiveKit에 직접 조회합니다. 녹화가 실패해도 송출은 계속됩니다.
- 코드: `src/features/recordings/egress.ts` (`startRecording`, `stopRecording`, `finishRecording`, `syncRecording`), `src/features/recordings/actions.ts`, `src/features/live/studio.tsx` (녹화 토글, 10분 타이머), [ADR-0002](adr/0002-recording-as-hls-segments.md)

### 녹화 영상 목록과 상세 조회 및 재생

- 홈 **최근 다시보기**와 `/recordings`(전체 목록, 카테고리 필터, 녹화 앞부분 프레임을 썸네일로·길이·카테고리·날짜), `/recordings/[id]`(상세·재생). HLS를 직접 재생하는 브라우저(Safari·최신 Chrome)는 그대로, 그 밖에는 `hls.js`로 재생합니다 — `src/features/recordings/replay-player.tsx`.
- 코드: `src/features/recordings/queries.ts` (`listRecordings`, `findRecording`), `src/features/recordings/recording-card.tsx`, `src/features/recordings/replay-player.tsx`, `src/app/recordings/page.tsx`, `src/app/recordings/[id]/page.tsx`

### 영상 정보와 저장 위치를 영구 저장

- `recordings` 테이블에 방송·egress id·상태·재생 목록 경로(`playlist_path`)·시작/종료 시각을 저장합니다. 방송을 삭제하면 녹화 행과 저장 파일도 삭제합니다(`deleteRecordingFiles`).
- 코드: `supabase/migrations/0001_init.sql`, `supabase/migrations/0003_recordings_bucket.sql`, `src/features/recordings/egress.ts`

## 추가 기능

### 카테고리

- 방송 등록·수정 때 카테고리(게임·음악·토크·공부·개발·기타)를 고르고, 서버는 목록에 있는 값만 받습니다(zod enum + DB check 제약). 전체 방송에서 카테고리로 거릅니다.
- 코드: `src/features/broadcasts/types.ts` (`CATEGORY_LABEL`), `src/app/broadcasts/page.tsx`, `supabase/migrations/0004_broadcast_category.sql`. 테스트: `src/features/broadcasts/types.test.ts`

### 팔로우

- 로그인한 사용자만 방송자를 팔로우·언팔로우합니다. 서버 액션이 로그인과 자기 자신 팔로우 금지를 확인하고(`assertCanFollow`), 언팔로우는 로그인한 사용자 자신의 팔로우만 지웁니다(`assertCanUnfollow`). 방송자 정보 옆에 팔로워 수를 공개로 표시합니다.
- `/following`(로그인 필요): 팔로우한 방송자의 방송 중 → 최근 방송.
- 코드: `src/features/follows/` (`policy.ts`, `actions.ts`, `queries.ts`, `follow-button.tsx`, `unfollow-button.tsx`), `src/app/following/page.tsx`, `listBroadcastsByOwners`(`src/features/broadcasts/queries.ts`), `supabase/migrations/0005_follows.sql`. 테스트: `src/features/follows/policy.test.ts`

### 편성표

- 방송 예정 시각(선택)을 KST로 입력·표시하고 UTC로 저장합니다. `/schedule`은 오늘(KST) 이후로 예정된 대기 중인 방송을 날짜별·시간순으로 보여줍니다.
- 코드: `src/features/broadcasts/schedule.ts`, `src/app/schedule/page.tsx`, `listScheduled`(`src/features/broadcasts/queries.ts`), `supabase/migrations/0006_broadcast_schedule.sql`. 테스트: `src/features/broadcasts/schedule.test.ts`

### 마이페이지

- `/me`는 서버에서 `getCurrentUser`로 로그인한 사용자를 확인하고(비로그인은 로그인 화면으로), **그 사용자 id로만** 조회합니다. 주소나 요청 값으로 다른 사람의 데이터를 고를 방법이 없습니다.
- 내 방송(상태·카테고리·날짜, 수정·삭제 — 기존 소유자 검증 서버 액션 사용), 받은 후원(전체·방송별 합계와 내역, "테스트 결제, 실제 정산 없음"), 내가 한 후원, 팔로워(본인만 보임)·팔로잉(팔로우 취소).
- 방송별 합계는 삭제된 방송의 후원을 "삭제된 방송"으로 묶습니다(`totalsByBroadcast`).
- 코드: `src/app/me/page.tsx`, `listReceivedDonations`·`listSentDonations`(`src/features/donations/queries.ts`), `src/features/donations/totals.ts`, `listFollowers`·`listFollowing`(`src/features/follows/queries.ts`). 테스트: `src/features/donations/totals.test.ts`

### 통계

- 마이페이지 맨 아래. 가짜 데이터 없이 실제 기록만 보여주고, 기록이 없으면 빈 상태 안내를 보여줍니다.
- 팔로워 수: 최근 14일(KST) 날짜별 누적 막대 그래프, 마우스·포커스 시 값과 **표로 보기**. `follows.created_at` 기준(언팔로우 이력은 없어 현재 팔로워 기준).
- 방송별 최고 시청자 수: LiveKit 웹훅 `participant_joined`마다 현재 시청자 수(방송자 제외)를 세어 DB 함수 `record_peak_viewers`로 더 큰 값만 남깁니다(동시 요청에도 줄지 않음).
- 다시보기 재생 수: 다시보기 화면을 열 때마다 DB 함수 `increment_recording_play`로 1 올립니다(새로고침 포함 단순 집계).
- 두 값은 2026-11-19부터 기록합니다. 그 전 방송·녹화는 0이라 목록에서 뺍니다. DB 함수는 서버 전용 키(service_role)만 실행할 수 있습니다.
- 코드: `src/features/follows/growth.ts`, `src/features/follows/growth-chart.tsx`, `recordPeakViewers`(`src/features/live/viewer-counts.ts`), `src/app/api/livekit/webhook/route.ts`, `countRecordingPlay`·`listMyRecordingPlays`(`src/features/recordings/queries.ts`), `supabase/migrations/0007_stats.sql`. 테스트: `src/features/follows/growth.test.ts`
