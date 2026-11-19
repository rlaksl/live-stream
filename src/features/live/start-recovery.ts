import type { BroadcastStatus } from "@/features/broadcasts/types";

type Result<T> = T | { error: string };

/**
 * 송출 시작이 실패했을 때 서버 상태를 `대기`로 되돌린다.
 * 되돌리지 못하면(오류 응답·요청 실패) 서버의 실제 상태를 다시 읽어 화면을 그 상태에 맞춘다.
 * 그것도 읽지 못하면 status는 null(화면 상태를 바꾸지 않는다).
 */
export async function revertFailedStart(
  cancel: () => Promise<Result<{ ok: true }>>,
  readStatus: () => Promise<Result<{ status: BroadcastStatus }>>,
): Promise<{ reverted: boolean; status: BroadcastStatus | null }> {
  const cancelled = await cancel().catch(() => null);
  if (cancelled && "ok" in cancelled) return { reverted: true, status: "waiting" };

  const current = await readStatus().catch(() => null);
  return { reverted: false, status: current && "status" in current ? current.status : null };
}
