"use server";

import { AppError, toActionError } from "@/lib/app-error";
import { getCurrentUser } from "@/features/auth/current-user";
import { assertCanRecord } from "@/features/broadcasts/policy";
import { getBroadcast } from "@/features/broadcasts/queries";
import { startRecording, stopRecording } from "./egress";

/** 송출을 시작한 직후 방송자가 호출한다. 녹화가 실패해도 송출은 계속된다. */
export async function startBroadcastRecording(broadcastId: string) {
  try {
    const broadcast = await getBroadcast(broadcastId);
    assertCanRecord(await getCurrentUser(), broadcast);
    await startRecording(broadcastId, broadcast.owner_id);
    return { ok: true as const };
  } catch (error) {
    // 권한·상태 문제(AppError)가 아닌 LiveKit·저장소 실패는 로그를 남기고 안내만 한다
    if (!(error instanceof AppError)) {
      console.error("녹화 시작 실패", error);
      return { error: "녹화를 시작하지 못했습니다. 방송은 계속됩니다." };
    }
    return toActionError(error);
  }
}

/** 녹화 최대 길이(10분)가 되면 송출 화면이 호출한다. 방송은 계속된다. */
export async function stopBroadcastRecording(broadcastId: string) {
  try {
    const broadcast = await getBroadcast(broadcastId);
    assertCanRecord(await getCurrentUser(), broadcast);
    await stopRecording(broadcastId);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
