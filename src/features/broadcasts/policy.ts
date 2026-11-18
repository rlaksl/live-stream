import { AppError, forbidden, loginRequired } from "@/lib/app-error";
import type { CurrentUser } from "@/features/auth/current-user";
import type { Broadcast } from "./types";

/**
 * 방송 권한 규칙. 서버의 모든 방송 수정·삭제·송출 제어·토큰 발급은 이 함수들을 거친다.
 * DB나 외부 서비스에 의존하지 않아 policy.test.ts에서 그대로 검증한다.
 */

type BroadcastRef = Pick<Broadcast, "owner_id" | "status">;

/** 수정·삭제·시작·종료: 로그인한 소유자만 */
export function assertOwner(user: CurrentUser | null, broadcast: BroadcastRef) {
  if (!user) throw loginRequired();
  if (user.id !== broadcast.owner_id) throw forbidden();
}

export function assertCanStart(user: CurrentUser | null, broadcast: BroadcastRef) {
  assertOwner(user, broadcast);
  if (broadcast.status !== "waiting") {
    throw new AppError(409, "대기 중인 방송만 시작할 수 있습니다.");
  }
}

export function assertCanEnd(user: CurrentUser | null, broadcast: BroadcastRef) {
  assertOwner(user, broadcast);
  if (broadcast.status !== "live") {
    throw new AppError(409, "방송 중인 방송만 종료할 수 있습니다.");
  }
}

/** 송출 토큰(canPublish): 소유자이고 방송 중일 때만 */
export function assertCanPublish(user: CurrentUser | null, broadcast: BroadcastRef) {
  assertOwner(user, broadcast);
  if (broadcast.status !== "live") {
    throw new AppError(409, "방송 중일 때만 송출할 수 있습니다.");
  }
}

/** 시청 토큰(구독 전용): 누구나, 방송 중일 때만. 종료된 방에 들어가 방이 다시 생기는 것을 막는다. */
export function assertCanWatch(broadcast: BroadcastRef) {
  if (broadcast.status !== "live") {
    throw new AppError(409, "방송 중이 아닙니다.");
  }
}
