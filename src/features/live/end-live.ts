import "server-only";
import { createAdminClient } from "@/lib/supabase";
import { roomService } from "@/lib/livekit";

/**
 * 방송 중인 방송을 종료한다. 종료 버튼, LiveKit 웹훅(방송자 이탈), 방송 중 삭제가 모두 이 함수를 쓴다.
 * 상태 변경은 `live`일 때만 일어나므로 여러 경로가 겹쳐도 한 번만 종료된다.
 * LiveKit 방을 삭제해 남은 송출·시청 연결을 끊는다.
 */
export async function endLive(broadcastId: string) {
  const { error } = await createAdminClient()
    .from("broadcasts")
    .update({ status: "ended", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", broadcastId)
    .eq("status", "live");
  if (error) throw error;

  // 방이 이미 없으면(모두 나가서 자동으로 닫힌 경우) LiveKit이 에러를 주므로 무시한다
  await roomService()
    .deleteRoom(broadcastId)
    .catch(() => {});
}
