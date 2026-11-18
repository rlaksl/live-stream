import { AppError, loginRequired } from "@/lib/app-error";
import type { CurrentUser } from "@/features/auth/current-user";

/**
 * 팔로우 권한 규칙. 서버의 팔로우·언팔로우는 이 함수들을 거친다. (policy.test.ts)
 * 언팔로우는 로그인한 사용자 자신의 팔로우만 지우므로 로그인만 확인한다.
 */

/** 팔로우: 로그인한 사용자, 자기 자신은 불가 */
export function assertCanFollow(user: CurrentUser | null, broadcasterId: string): asserts user is CurrentUser {
  if (!user) throw loginRequired();
  if (user.id === broadcasterId) throw new AppError(409, "자기 자신은 팔로우할 수 없습니다.");
}

/** 언팔로우: 로그인한 사용자 */
export function assertCanUnfollow(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) throw loginRequired();
}
