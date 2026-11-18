import { AccessToken } from "livekit-server-sdk";

/**
 * LiveKit 접속 토큰. 방 이름은 방송 id이다.
 * 송출 권한(canPublish)은 publisher 토큰에만 있고, viewer 토큰은 구독 전용이다.
 * 누가 어떤 토큰을 받을 수 있는지는 broadcasts/policy.ts가 정한다.
 */
export type LiveRole = "publisher" | "viewer";

export async function createLiveToken(input: {
  broadcastId: string;
  role: LiveRole;
  identity: string;
  name: string;
}) {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: input.identity,
    name: input.name,
    ttl: "6h",
  });
  token.addGrant({
    room: input.broadcastId,
    roomJoin: true,
    canSubscribe: true,
    canPublish: input.role === "publisher",
    canPublishData: false,
  });
  return token.toJwt();
}
