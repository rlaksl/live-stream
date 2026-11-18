import { WebhookReceiver } from "livekit-server-sdk";
import { endLive } from "@/features/live/end-live";
import { isPublisherIdentity } from "@/features/live/identity";
import { recordPeakViewers } from "@/features/live/viewer-counts";
import { finishRecording } from "@/features/recordings/egress";

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

/**
 * LiveKit Cloud 웹훅. 서명(Authorization 헤더)을 검증한 뒤 처리한다.
 * - 방송자가 종료 버튼 없이 나가거나(탭 닫기·연결 끊김) 방이 닫히면 방송을 `종료`로 바꾼다.
 * - 시청자가 들어오면 최고 시청자 수를 갱신한다(마이페이지 통계).
 * - 녹화가 끝나면(egress_ended) 녹화 상태(완료·실패)를 기록한다.
 */
export async function POST(request: Request) {
  let event;
  try {
    event = await receiver.receive(await request.text(), request.headers.get("Authorization") ?? undefined);
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  if (event.event === "egress_ended" && event.egressInfo) {
    await finishRecording(event.egressInfo);
    return new Response("ok");
  }

  const broadcastId = event.room?.name;
  if (!broadcastId) return new Response("ok");

  const publisherLeft = event.event === "participant_left" && isPublisherIdentity(event.participant?.identity ?? "");
  const viewerJoined = event.event === "participant_joined" && !isPublisherIdentity(event.participant?.identity ?? "");
  if (viewerJoined) await recordPeakViewers(broadcastId);

  if (publisherLeft || event.event === "room_finished") {
    await endLive(broadcastId);
  }

  return new Response("ok");
}
