import { TokenVerifier } from "livekit-server-sdk";
import { beforeAll, describe, expect, it } from "vitest";
import { createLiveToken } from "./token";
import { publisherIdentity } from "./identity";

beforeAll(() => {
  process.env.LIVEKIT_API_KEY = "test-key";
  process.env.LIVEKIT_API_SECRET = "test-secret-that-is-long-enough-for-hs256";
});

async function grantsOf(role: "publisher" | "viewer") {
  const jwt = await createLiveToken({ broadcastId: "b1", role, identity: "someone", name: "이름" });
  const claims = await new TokenVerifier(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
  ).verify(jwt);
  return claims.video!;
}

describe("LiveKit 토큰 권한", () => {
  it("publisher 토큰만 송출할 수 있다", async () => {
    const grant = await grantsOf("publisher");
    expect(grant).toMatchObject({ room: "b1", roomJoin: true, canPublish: true, canSubscribe: true });
  });

  it("viewer 토큰은 구독 전용이다", async () => {
    const grant = await grantsOf("viewer");
    expect(grant).toMatchObject({ room: "b1", roomJoin: true, canPublish: false, canSubscribe: true });
    expect(grant.canPublishData).toBe(false);
  });

  it("방송자 identity는 소유자 id로 정해진다", () => {
    expect(publisherIdentity("u1")).toBe("owner-u1");
  });
});
