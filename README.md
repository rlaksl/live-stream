# BRDCST <sub>broadcast</sub>

PC 화면 공유나 휴대폰 카메라로 실시간 방송을 송출하고, 누구나 로그인 없이 시청하는 웹 서비스입니다.
댓글, 토스페이먼츠 테스트 결제 후원(알림 배너·음성), 녹화·다시보기, 팔로우, 편성표, 마이페이지(후원 내역·통계)를 함께 제공합니다.

- **서비스 주소:** https://brdcst-gray.vercel.app
- **시연 영상:** _(추가 예정)_
- **요구사항별 구현 근거·코드 위치:** [docs/checklist.md](docs/checklist.md)

## 테스트 계정

로그인 화면(`/login`) 아래쪽의 **"평가용 테스트 계정으로 바로 로그인"** 에서 버튼 하나로 로그인합니다. 비밀번호 입력이 필요 없습니다.

| 버튼 | 이메일 | 비밀번호 | 닉네임 | 쓰임 |
| --- | --- | --- | --- | --- |
| 방송자A | `test-a@example.com` | `brdcst-test-1234` | 방송자A | 방송 등록·송출 (소유자) |
| 시청자B | `test-b@example.com` | `brdcst-test-1234` | 시청자B | 다른 사용자 (댓글·후원, 권한 거절 확인) |

바로 로그인 버튼이 동작하지 않으면 위 이메일과 비밀번호를 로그인 화면에 직접 입력하세요. 평가용으로 공개한 값입니다.

권한 확인에는 브라우저 두 개(또는 일반 창 + 시크릿 창)에서 A와 B로 각각 로그인하고, 로그인하지 않은 창을 하나 더 쓰면 편합니다.
직접 회원가입(`/signup`, 이메일 인증 없음)도 할 수 있습니다.

## 기능 확인 방법

### 지원 환경

| 구분 | 환경 |
| --- | --- |
| PC 송출 (화면 공유 + 탭/시스템 소리 + 마이크) | Chrome·Edge 데스크톱 (최신) |
| PC 송출 (화면 공유 + 마이크, 탭 소리 없음) | Safari, Firefox 데스크톱 — 브라우저가 화면 공유 오디오를 지원하지 않음 |
| 모바일 송출 (카메라 + 마이크) | iOS Safari, Android Chrome |
| 시청·다시보기 | 위 브라우저 모두 (PC·모바일) |

카메라·마이크·화면 공유 권한을 허용해야 합니다. 서비스 주소는 HTTPS입니다.

### PC 방송: 송출 → 시청 → 종료

1. PC Chrome에서 **방송자A** 로 로그인 → 헤더의 **방송하기** → 제목 입력 → **등록하고 송출 화면으로**
2. 송출 화면에서 **🖥️ 화면 공유** 선택 → **미리보기 시작** → 공유 창에서 탭(또는 화면)을 고르고 **"탭 오디오 공유"(또는 "시스템 오디오 공유")를 켭니다.** 마이크 권한도 허용합니다.
3. (선택) **녹화하기** 를 켜면 녹화됩니다. **녹화 토글을 켜야 녹화되며**, 방송당 최대 10분입니다.
4. **방송 시작** → 상태가 `방송 중`이 됩니다.
5. 다른 기기(휴대폰 등)에서 로그인 없이 서비스 주소 → 홈의 **방송 중** → 방송 선택 → 화면과 소리(탭 소리 + 마이크)가 재생됩니다. 시청자 수가 표시됩니다.
6. 송출 화면에서 **방송 종료** → 시청 화면이 X 눈 마스코트의 "방송이 종료되었습니다"로 바뀌고 송출이 끊깁니다.
   종료 버튼 없이 탭을 닫아도 잠시 뒤 서버가 `종료`로 바꿉니다(LiveKit 웹훅).

### 모바일 방송: 송출 → 시청 → 종료

1. 휴대폰에서 서비스 주소 → **방송자A** 로 로그인 → **방송하기** → 제목 입력 → 등록
2. 송출 화면에서 **📷 카메라** 가 선택되어 있습니다(모바일은 화면 공유 대신 카메라). **미리보기 시작** → 카메라·마이크 허용
3. **방송 시작** → 방송 중에 **카메라 전환**(전면/후면), **마이크 끄기/켜기** 를 쓸 수 있습니다.
4. PC 등 다른 기기에서 방송을 열면 카메라 영상과 마이크 음성이 재생됩니다.
5. **방송 종료** → 시청 화면이 종료 상태로 바뀝니다.

### 방송 관리

- 홈: **대표 영상** 캐러셀(방송 중 → 최근 다시보기 순, 화살표·점으로 넘김) + **내 방송 시작** → 카테고리 칩 → **방송 중**(시청자 수, 없으면 놀란 눈 마스코트) → **최근 다시보기**. 전체 방송(최신순)은 **전체 보기**(`/broadcasts`)에서 카테고리(게임·음악·토크·공부·개발·기타)로 거를 수 있습니다. 카테고리는 방송 등록·수정 때 고릅니다
- 방송 상세: `대기`는 졸린 마스코트와 "곧 방송을 시작합니다", `방송 중`은 플레이어, `종료`는 X 눈 마스코트와 녹화 바로가기
- 소유자에게만 상세 화면에 **송출 화면 / 수정 / 삭제** 버튼이 보입니다. 방송 중인 방송을 삭제하면 송출을 먼저 종료합니다.
- 방송 정보는 Supabase(Postgres)에 저장되어 서버 재시작·재배포 후에도 그대로 조회됩니다.

### 권한 확인 절차 (비로그인 / 소유자 / 다른 사용자)

화면 접근 제한은 편의일 뿐이고, 모든 쓰기 동작은 서버(서버 액션·Route Handler)에서 다시 확인합니다.

| 동작 | 비로그인 | 다른 사용자(B) | 소유자(A) |
| --- | --- | --- | --- |
| 방송 목록·상세·시청·다시보기 | 허용 | 허용 | 허용 |
| 방송 등록 (`/broadcasts/new`) | 로그인 화면으로 이동, 서버 401 | 허용 | 허용 |
| 방송 수정·삭제 | 버튼 없음, 서버 401 | 버튼 없음, `/broadcasts/{id}/edit` 직접 접근 시 상세로 이동, 서버 403 | 허용 |
| 방송 시작·종료, 송출 토큰 | 서버 401 | 서버 403 | 허용 (송출 토큰은 `방송 중`일 때만) |
| 시청 토큰 (구독 전용) | 허용 | 허용 | 허용 |
| 댓글 작성 | 로그인 링크만 보임, 서버 401 | 허용 | 허용 |
| 댓글 수정·삭제 | 서버 401 | 작성자가 아니면 버튼 없음, 서버 403 | 작성자만 |
| 후원 | 로그인 링크만 보임, 서버 401 | 허용 | 자기 방송은 거절 (403) |
| 팔로잉·마이페이지 (`/following`, `/me`) | 로그인 화면으로 이동 | 본인 데이터만 | 본인 데이터만 |

확인 방법:
1. 비로그인 창에서 방송 목록·상세·시청이 되는지, **방송하기** 대신 로그인 버튼만 있는지, `/broadcasts/new`로 가면 로그인 화면으로 가는지 봅니다.
2. B로 A의 방송 상세를 열면 수정·삭제·송출 버튼이 없습니다. 주소창에 `/broadcasts/{A의 방송 id}/edit`, `/studio`를 직접 입력해도 상세로 돌아갑니다.
3. 서버 판단은 Vitest로 사용자 유형 × 동작마다 검증합니다: `npm test` (`src/features/*/policy.test.ts`, `src/features/live/token.test.ts`).

### 댓글

방송 상세 옆(모바일은 아래)에 있습니다. 로그인한 사용자가 쓰고, 작성자만 수정·삭제합니다. 2.5초마다 새로 불러옵니다.
방송자 닉네임은 형광펜, 내 닉네임은 주황색으로 표시합니다. 메시지가 있는 후원은 댓글 사이에 **형광펜 닉네임 + "N원 후원"** 으로 구분해 보이고, 수정·삭제 버튼이 없습니다.

### 후원 (토스페이먼츠 테스트 결제)

1. **시청자B** 로 로그인 → A의 방송 상세 → 후원 영역의 **후원하기**
2. 금액(1,000 / 5,000 / 10,000원 또는 직접 입력, 1,000원 이상)과 메시지(선택, 100자) → **○○원 후원하기**
3. 토스 결제창이 열립니다(테스트 모드, 실제 출금 없음). **카카오페이 등 간편결제** 로 진행하세요.
   카드사를 고르면 테스트 모드에서도 카드사 앱 인증 화면이 떠서 진행이 어려울 수 있습니다.
4. 결제가 끝나면 "후원 완료" 화면 → **방송으로 돌아가기** → 후원 내역(닉네임·금액·메시지)과 합계가 보입니다.

서버는 결제 전에 `대기` 후원(금액·방송·방송자)을 저장하고, 결제 후 저장된 금액과 비교한 뒤 토스 승인 API를 호출해 `확정`합니다.
토스 웹훅(`PAYMENT_STATUS_CHANGED`)이 오면 토스에 결제를 다시 조회해 같은 확정 함수를 씁니다. `대기 → 확정`은 조건부 업데이트라, 성공 화면 새로고침이나 웹훅 반복 통지에도 한 번만 적립됩니다.
자기 방송에는 후원할 수 없습니다.

**후원 알림:** 후원이 확정되면 시청 화면과 송출 화면의 영상 위에 5초 동안 배너(PC는 위쪽 가운데·마스코트, 모바일은 아래 한 줄)가 뜨고, 효과음 뒤에 "닉네임님 N원 후원"을 읽어 줍니다. 여러 건이면 차례로 보여줍니다.
- 브라우저 정책상 **화면을 한 번 누르거나 클릭한 뒤에야** 소리가 납니다.
- 음성은 브라우저 내장 음성을 씁니다. 한국어 음성이 없는 환경에서는 효과음과 배너만 나옵니다.
- 영상 위의 **후원 음성** 버튼(모바일은 스피커 아이콘)으로 끄고 켤 수 있고, 이 브라우저에 기억됩니다.

### 녹화·다시보기

송출 화면에서 **녹화하기** 를 켜고 방송을 시작한 경우에만 녹화됩니다(최대 10분). 방송이 끝나면 홈의 **최근 다시보기**, 헤더의 **다시보기**(`/recordings`, 카테고리로 거르기), 방송 상세의 **▶ 녹화 다시보기** 에서 재생합니다.
녹화는 LiveKit egress가 HLS 조각으로 Supabase Storage에 저장하며, 무료 한도(월 60분) 때문에 길이를 제한했습니다.

### 팔로우

방송 상세에서 방송자를 **팔로우** 합니다(로그인한 사용자만, 자기 자신은 불가). 방송자 정보 옆에 팔로워 수가 공개로 표시됩니다. 팔로우한 방송자의 방송 중·최근 방송은 헤더의 **팔로잉**(`/following`)에 모입니다. 비로그인으로 누르면 로그인 후 그 방송으로 돌아옵니다.

### 편성표

방송 등록·수정 때 **방송 예정 시각**(선택, 한국 시간)을 넣으면 헤더의 **편성표**(`/schedule`)에 날짜별·시간순으로 보입니다. 아직 시작하지 않은 방송만 보이고, 카드와 방송 상세에 "예정 11/20(금) 20:00"처럼 표시됩니다.

### 마이페이지

로그인 후 헤더의 **마이페이지**(`/me`)에서 내 정보만 봅니다. 서버가 로그인한 사용자 본인의 데이터만 조회하고, 비로그인은 로그인 화면으로 보냅니다.
- **내 방송:** 상태·카테고리·날짜와 **수정 / 삭제**
- **받은 후원:** 전체 합계와 방송별 합계, 내역. 테스트 결제라 실제 정산은 없습니다.
- **내가 한 후원:** 합계와 내역
- **팔로워**(나만 볼 수 있음)와 **팔로잉**(팔로우 취소 가능)
- **통계:** 최근 14일 팔로워 수 막대 그래프(값은 마우스를 올리거나 **표로 보기** 로 확인), 방송별 최고 시청자 수, 다시보기 재생 수. 최고 시청자 수와 재생 수는 이 기능을 추가한 2026-11-19부터 기록하며(가짜 데이터 없음), 기록이 없으면 빈 상태 안내가 보입니다.

## 실행 방법

### 환경

- Node.js 24 (개발 환경 v24.22.0), npm
- 외부 서비스(모두 무료/테스트 요금제): Supabase, LiveKit Cloud, 토스페이먼츠(API 개별 연동 키, 테스트), Vercel(배포·크론)

### 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 표)
npm run dev                  # http://localhost:3000
```

Supabase SQL Editor에서 `supabase/migrations/`의 SQL을 번호 순서대로 실행합니다(테이블·RLS, service_role 권한, 녹화 버킷).

### 환경변수 예시 (`.env.example`)

실제 값은 `.env.local`(git 제외)과 Vercel 환경변수에만 넣습니다.

| 이름 | 예시 / 설명 |
| --- | --- |
| `APP_URL` | `http://localhost:3000` — 결제 성공·실패 리다이렉트 주소 |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | 로그인 세션(쿠키) 확인용 |
| `SUPABASE_SECRET_KEY` | 서버 전용 DB 접근 키 |
| `LIVEKIT_URL` | `wss://<project>.livekit.cloud` |
| `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | 토큰 발급·웹훅 서명 검증·방 삭제·녹화 |
| `RECORDING_S3_ENDPOINT` | `https://<project-ref>.storage.supabase.co/storage/v1/s3` |
| `RECORDING_S3_REGION`, `RECORDING_S3_BUCKET` | `ap-northeast-2`, `recordings` |
| `RECORDING_S3_ACCESS_KEY`, `RECORDING_S3_SECRET` | Supabase Storage S3 액세스 키 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | 토스 API 개별 연동 테스트 키 `test_ck_…`, `test_sk_…` |
| `TEST_ACCOUNT_PASSWORD` | 테스트 계정 A/B 비밀번호(바로 로그인 버튼이 사용) |
| `CRON_SECRET` | 크론 호출 검증값 |

### 외부 서비스 설정

- **LiveKit Cloud 웹훅:** `https://<서비스 주소>/api/livekit/webhook` (방송자 이탈 시 자동 종료, 녹화 완료 기록)
- **토스페이먼츠 웹훅:** `https://<서비스 주소>/api/toss/webhook`, 이벤트 `PAYMENT_STATUS_CHANGED`
- **Vercel:** 함수 지역 서울(`vercel.json`의 `regions: ["icn1"]`). 토스 API 키 접근 정책을 "대한민국"으로 제한한 경우 필요합니다. Supabase 무료 요금제의 7일 비활성 일시중지를 막기 위해 매일 03:00(KST) `/api/cron/keepalive`를 호출합니다.

### 검사

```bash
npm test          # Vitest: 권한·토큰·후원 확정·크론 인증
npm run typecheck
npm run lint
npm run build
```

## 구조

```
src/
  app/                  화면(라우트)과 API (LiveKit·토스 웹훅, 크론, 댓글·후원 목록)
  features/
    auth/               가입·로그인·로그아웃, 현재 사용자, 테스트 계정
    broadcasts/         방송 CRUD, 권한 규칙(policy.ts)
    live/               송출 화면(studio), 시청 플레이어, LiveKit 토큰, 종료 처리
    recordings/         녹화(egress)·다시보기
    comments/           댓글
    donations/          후원(토스 결제창, 확정 로직 confirm.ts, 후원 알림)
    follows/            팔로우, 팔로워 그래프
    home/               홈 대표 영상 캐러셀
    mascot/             브라운관 TV 마스코트(코드로 그린 픽셀 노이즈)
  lib/                  Supabase·LiveKit 클라이언트, 에러 타입
supabase/migrations/    DB 스키마
docs/adr/               주요 결정 기록
```

- 브라우저는 Supabase에 직접 접근하지 않고, 모든 읽기·쓰기와 권한 판단을 앱 서버가 합니다([ADR-0001](docs/adr/0001-server-only-data-access.md)).
- 녹화는 HLS 조각으로 저장합니다([ADR-0002](docs/adr/0002-recording-as-hls-segments.md)).
- 후원은 웹훅 내용을 믿지 않고 토스에 다시 조회해 확정합니다([ADR-0003](docs/adr/0003-donation-confirmed-by-server-lookup.md)).

## 오픈소스와 출처

| 이름 | 용도 | 라이선스 |
| --- | --- | --- |
| [Next.js](https://github.com/vercel/next.js), [React](https://github.com/facebook/react) | 프론트·백엔드 프레임워크 | MIT |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss), [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 스타일 | MIT |
| [shadcn/ui](https://github.com/shadcn-ui/ui) (`base-nova` 스타일) | `src/components/ui/*` 컴포넌트는 shadcn CLI로 생성한 코드 | MIT |
| [Base UI](https://github.com/mui/base-ui) | shadcn 컴포넌트의 기반 | MIT |
| [LiveKit](https://github.com/livekit) (`livekit-client`, `@livekit/components-react`, `@livekit/components-styles`, `livekit-server-sdk`) | 송출·시청(WebRTC), 토큰, 웹훅, 녹화 | Apache-2.0 |
| [Supabase JS](https://github.com/supabase/supabase-js), [@supabase/ssr](https://github.com/supabase/ssr) | DB·인증·저장소 | MIT |
| [hls.js](https://github.com/video-dev/hls.js) | 다시보기 재생 | Apache-2.0 |
| [@tosspayments/tosspayments-sdk](https://github.com/tosspayments/browser-sdk) | 결제창 | MIT |
| [zod](https://github.com/colinhacks/zod) | 입력 검증 | MIT |
| [sonner](https://github.com/emilkowalski/sonner), [next-themes](https://github.com/pacocoursey/next-themes), [cn](https://github.com/shadcn-ui/cn), [server-only](https://www.npmjs.com/package/server-only) | 알림, 테마, 클래스 병합, 서버 전용 모듈 표시 | MIT |
| [lucide-react](https://github.com/lucide-icons/lucide) | 아이콘 | ISC |
| [class-variance-authority](https://github.com/joe-bell/cva) | 컴포넌트 스타일 변형 | Apache-2.0 |
| [Vitest](https://github.com/vitest-dev/vitest) | 테스트 | MIT |
| 글꼴 Noto Sans KR, Geist Mono, Silkscreen (Google Fonts, `next/font`) | 본문·숫자·로고 | OFL-1.1 |

- 마스코트(브라운관 TV)와 노이즈·글리치는 이 프로젝트에서 직접 만든 코드(`src/features/mascot/`)이며, 다른 서비스의 로고나 캐릭터를 따라 하지 않았습니다.
- 개발에는 AI 개발 도구(Claude Code)를 사용했습니다.
