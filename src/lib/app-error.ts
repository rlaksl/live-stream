/**
 * 사용자에게 보여줄 수 있는 실패. status는 Route Handler에서 HTTP 상태 코드로 그대로 쓴다.
 * 401: 로그인 필요, 403: 권한 없음, 404: 없음, 409: 현재 상태에서 불가, 400: 입력 오류
 */
export class AppError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export const loginRequired = () => new AppError(401, "로그인이 필요합니다.");
export const forbidden = () => new AppError(403, "권한이 없습니다.");
export const notFound = (what: string) => new AppError(404, `${what}을(를) 찾을 수 없습니다.`);

/** Server Action에서 AppError를 폼 상태({ error })로 바꾼다. 그 밖의 에러는 그대로 던진다. */
export function toActionError(error: unknown): { error: string } {
  if (error instanceof AppError) return { error: error.message };
  throw error;
}

/** Route Handler에서 AppError를 JSON 응답으로 바꾼다. 그 밖의 에러는 그대로 던진다(500). */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
