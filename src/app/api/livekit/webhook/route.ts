import { WebhookReceiver } from "livekit-server-sdk";
import { endLive } from "@/features/live/end-live";
import { isPublisherIdentity } from "@/features/live/identity";

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

/**
 * LiveKit Cloud 웹훅. 서명(Authorization 헤더)을 검증한 뒤 처리한다.
 * 방송자가 종료 버튼 없이 나가거나(탭 닫기·연결 끊김) 방이 닫히면 방송을 `종료`로 바꾼다.
 */
export async function POST(request: Request) {
  let event;
  try {
    event = await receiver.receive(await request.text(), request.headers.get("Authorization") ?? undefined);
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  const broadcastId = event.room?.name;
  if (!broadcastId) return new Response("ok");

  const publisherLeft =
    event.event === "participant_left" && isPublisherIdentity(event.participant?.identity ?? "");
  if (publisherLeft || event.event === "room_finished") {
    await endLive(broadcastId);
  }

  return new Response("ok");
}
