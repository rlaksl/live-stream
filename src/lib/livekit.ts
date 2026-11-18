import "server-only";
import { EgressClient, RoomServiceClient } from "livekit-server-sdk";

/** LiveKit 서버 API는 https 주소를 쓴다 (클라이언트 연결 주소는 wss). */
const apiUrl = () => process.env.LIVEKIT_URL!.replace(/^wss:/, "https:");

export const roomService = () =>
  new RoomServiceClient(apiUrl(), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export const egressClient = () =>
  new EgressClient(apiUrl(), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
