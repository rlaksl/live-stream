import "server-only";
import { roomService } from "@/lib/livekit";
import { createAdminClient } from "@/lib/supabase";
import { isPublisherIdentity } from "./identity";

/** 방송 id → 현재 시청자 수 (방 참가자에서 방송자 1명을 뺀 값) */
export async function getViewerCounts(broadcastIds: string[]): Promise<Map<string, number>> {
  if (broadcastIds.length === 0) return new Map();
  const rooms = await roomService().listRooms(broadcastIds);
  return new Map(rooms.map((room) => [room.name, Math.max(0, room.numParticipants - 1)]));
}

/** 시청자가 들어올 때마다 지금 시청자 수(방송자 제외)를 세어 방송의 최고 시청자 수를 갱신한다. */
export async function recordPeakViewers(broadcastId: string) {
  const participants = await roomService().listParticipants(broadcastId);
  const viewers = participants.filter((p) => !isPublisherIdentity(p.identity)).length;
  const { error } = await createAdminClient().rpc("record_peak_viewers", {
    p_broadcast_id: broadcastId,
    p_viewers: viewers,
  });
  if (error) throw error;
}
