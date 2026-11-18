import "server-only";
import { roomService } from "@/lib/livekit";

/** 방송 id → 현재 시청자 수 (방 참가자에서 방송자 1명을 뺀 값) */
export async function getViewerCounts(broadcastIds: string[]): Promise<Map<string, number>> {
  if (broadcastIds.length === 0) return new Map();
  const rooms = await roomService().listRooms(broadcastIds);
  return new Map(rooms.map((room) => [room.name, Math.max(0, room.numParticipants - 1)]));
}
