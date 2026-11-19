import "server-only";
import { ServerError } from "livekit-server-sdk";
import { AppError } from "@/lib/app-error";
import { createAdminClient } from "@/lib/supabase";
import { roomService } from "@/lib/livekit";
import { stopRecording } from "@/features/recordings/egress";

/**
 * 방송 중인 방송을 종료한다. 종료 버튼, LiveKit 웹훅(방송자 이탈), 방송 중 삭제가 모두 이 함수를 쓴다.
 * 상태 변경은 `live`일 때만 일어나므로 여러 경로가 겹쳐도 한 번만 종료된다.
 * 녹화를 멈추고, LiveKit 방을 삭제해 남은 송출·시청 연결을 끊는다.
 */
export async function endLive(broadcastId: string) {
  const { error } = await createAdminClient()
    .from("broadcasts")
    .update({ status: "ended", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", broadcastId)
    .eq("status", "live");
  if (error) throw error;

  await stopRecording(broadcastId);
  try {
    await roomService().deleteRoom(broadcastId);
  } catch (error) {
    // 방이 이미 없으면(모두 나가서 자동으로 닫힌 경우) LiveKit이 404 not_found를 준다. 정상 종료다.
    if (error instanceof ServerError && error.code === "not_found") return;
    // 그 밖의 실패는 시청 연결이 남을 수 있으니 숨기지 않는다. 상태는 이미 `종료`라 다시 종료되지 않고,
    // 방송자가 나갈 때 오는 웹훅(participant_left)이 이 함수를 다시 불러 방 삭제를 재시도한다.
    console.error("LiveKit 방 삭제 실패", broadcastId, error);
    throw new AppError(502, "방송은 종료했지만 시청 연결을 바로 끊지 못했습니다. 시청 화면은 잠시 뒤 정리됩니다.");
  }
}
