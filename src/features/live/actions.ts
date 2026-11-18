"use server";

import { createAdminClient } from "@/lib/supabase";
import { AppError, toActionError } from "@/lib/app-error";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  assertCanEnd,
  assertCanPublish,
  assertCanStart,
  assertCanWatch,
} from "@/features/broadcasts/policy";
import { getBroadcast } from "@/features/broadcasts/queries";
import { createLiveToken } from "./token";
import { publisherIdentity } from "./identity";
import { endLive } from "./end-live";

export type LiveConnection = { serverUrl: string; token: string };

/** 대기 → 방송 중. 사용자당 방송 중인 방송은 1개(DB 부분 unique 인덱스). */
export async function startBroadcast(id: string, recordEnabled: boolean) {
  try {
    const broadcast = await getBroadcast(id);
    assertCanStart(await getCurrentUser(), broadcast);

    const now = new Date().toISOString();
    const { error } = await createAdminClient()
      .from("broadcasts")
      .update({ status: "live", record_enabled: recordEnabled, started_at: now, updated_at: now })
      .eq("id", id)
      .eq("status", "waiting");
    if (error?.code === "23505") {
      throw new AppError(409, "이미 방송 중인 다른 방송이 있습니다. 그 방송을 먼저 종료하세요.");
    }
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function endBroadcast(id: string) {
  try {
    const broadcast = await getBroadcast(id);
    assertCanEnd(await getCurrentUser(), broadcast);
    await endLive(id);
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

/** 송출 토큰: 소유자 + 방송 중일 때만 */
export async function getPublishConnection(id: string) {
  try {
    const user = await getCurrentUser();
    const broadcast = await getBroadcast(id);
    assertCanPublish(user, broadcast);
    const token = await createLiveToken({
      broadcastId: id,
      role: "publisher",
      identity: publisherIdentity(broadcast.owner_id),
      name: broadcast.owner.nickname,
    });
    return { serverUrl: process.env.LIVEKIT_URL!, token };
  } catch (error) {
    return toActionError(error);
  }
}

/** 시청 토큰: 구독 전용, 로그인 없이 가능, 방송 중일 때만 */
export async function getViewerConnection(id: string) {
  try {
    const broadcast = await getBroadcast(id);
    assertCanWatch(broadcast);
    const user = await getCurrentUser();
    const token = await createLiveToken({
      broadcastId: id,
      role: "viewer",
      // 같은 사람이 여러 탭에서 봐도 서로 끊기지 않도록 매번 다른 identity를 쓴다
      identity: `viewer-${crypto.randomUUID()}`,
      name: user?.nickname ?? "익명",
    });
    return { serverUrl: process.env.LIVEKIT_URL!, token };
  } catch (error) {
    return toActionError(error);
  }
}
