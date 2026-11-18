import { forbidden, loginRequired } from "@/lib/app-error";
import type { CurrentUser } from "@/features/auth/current-user";

/**
 * 댓글 권한 규칙. 서버의 댓글 작성·수정·삭제는 이 함수들을 거친다. (policy.test.ts)
 * 조회는 누구나 할 수 있고, 모든 상태(대기·방송 중·종료)의 방송에 댓글을 쓸 수 있다.
 */

/** 작성: 로그인한 사용자 */
export function assertCanComment(user: CurrentUser | null): asserts user is CurrentUser {
  if (!user) throw loginRequired();
}

/** 수정·삭제: 작성자만 */
export function assertCommentAuthor(user: CurrentUser | null, comment: { author_id: string }) {
  if (!user) throw loginRequired();
  if (user.id !== comment.author_id) throw forbidden();
}
