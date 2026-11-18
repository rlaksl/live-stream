import { z } from "zod";
import { AppError, loginRequired } from "@/lib/app-error";
import type { CurrentUser } from "@/features/auth/current-user";

/**
 * 후원 권한·입력 규칙. 서버의 후원 생성은 이 함수들을 거친다. (policy.test.ts)
 * 모든 상태(대기·방송 중·종료)의 방송에 후원할 수 있고, 자기 방송에는 후원할 수 없다.
 */

export const AMOUNT_PRESETS = [1000, 5000, 10000];
export const MIN_AMOUNT = 1000;
export const MAX_AMOUNT = 1_000_000;
export const MAX_MESSAGE = 100;

/** 화면 금액 표기: 12,345원 */
export const won = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

/** 후원: 로그인한 사용자, 단 자기 방송은 거절 */
export function assertCanDonate(
  user: CurrentUser | null,
  broadcast: { owner_id: string },
): asserts user is CurrentUser {
  if (!user) throw loginRequired();
  if (user.id === broadcast.owner_id) throw new AppError(403, "자기 방송에는 후원할 수 없습니다.");
}

const inputSchema = z.object({
  amount: z
    .number()
    .int("후원 금액은 원 단위 정수입니다.")
    .min(MIN_AMOUNT, "후원 금액은 1,000원 이상입니다.")
    .max(MAX_AMOUNT, "후원 금액은 1,000,000원 이하입니다."),
  message: z.string().trim().max(MAX_MESSAGE, "후원 메시지는 100자 이하입니다."),
});

export function parseDonationInput(input: { amount: number; message: string }) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message);
  return parsed.data;
}
