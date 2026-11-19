import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServerError } from "livekit-server-sdk";
import { AppError } from "@/lib/app-error";

// 외부 서비스(LiveKit·DB·녹화)는 가짜로 바꾸고, 실패를 어떻게 다루는지만 본다
const deleteRoom = vi.fn();
const listRooms = vi.fn();
vi.mock("@/lib/livekit", () => ({ roomService: () => ({ deleteRoom, listRooms }) }));
vi.mock("@/lib/supabase", () => ({
  createAdminClient: () => ({
    from: () => ({ update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
  }),
}));
vi.mock("@/features/recordings/egress", () => ({ stopRecording: async () => {} }));

const { endLive } = await import("./end-live");
const { getViewerCounts } = await import("./viewer-counts");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("endLive 방 삭제", () => {
  it("방이 이미 없으면(404 not_found) 정상 종료로 본다", async () => {
    deleteRoom.mockRejectedValue(new ServerError("not_found", "requested room does not exist", 404, "not_found"));
    await expect(endLive("b1")).resolves.toBeUndefined();
  });

  it("그 밖의 실패는 숨기지 않고 502 AppError로 알린다", async () => {
    deleteRoom.mockRejectedValue(new ServerError("internal", "boom", 500, "internal"));
    const error = await endLive("b1").catch((e) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(502);
  });

  it("네트워크 오류도 실제 실패로 본다", async () => {
    deleteRoom.mockRejectedValue(new TypeError("fetch failed"));
    await expect(endLive("b1")).rejects.toBeInstanceOf(AppError);
  });
});

describe("getViewerCounts", () => {
  it("방 참가자에서 방송자 1명을 뺀 값을 돌려준다", async () => {
    listRooms.mockResolvedValue([{ name: "b1", numParticipants: 4 }]);
    expect(await getViewerCounts(["b1"])).toEqual(new Map([["b1", 3]]));
  });

  it("LiveKit 조회가 실패해도 오류를 던지지 않고 빈 결과를 돌려준다(카드는 그대로 표시)", async () => {
    listRooms.mockRejectedValue(new TypeError("fetch failed"));
    expect(await getViewerCounts(["b1"])).toEqual(new Map());
  });
});
