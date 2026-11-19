import { describe, expect, it } from "vitest";
import { revertFailedStart } from "./start-recovery";

const ok = async () => ({ ok: true as const });
const failed = async () => ({ error: "권한이 없습니다." });
const thrown = async (): Promise<never> => {
  throw new Error("network");
};
const statusIs = (status: "waiting" | "live" | "ended") => async () => ({ status });

describe("revertFailedStart", () => {
  it("되돌리기에 성공하면 대기로 표시한다", async () => {
    expect(await revertFailedStart(ok, statusIs("live"))).toEqual({ reverted: true, status: "waiting" });
  });

  it("되돌리기가 오류를 반환하면 서버의 실제 상태(방송 중)로 표시한다", async () => {
    expect(await revertFailedStart(failed, statusIs("live"))).toEqual({ reverted: false, status: "live" });
  });

  it("되돌리기 요청 자체가 실패해도 서버 상태를 다시 읽는다", async () => {
    expect(await revertFailedStart(thrown, statusIs("ended"))).toEqual({ reverted: false, status: "ended" });
  });

  it("서버 상태도 읽지 못하면 status는 null(화면 상태를 바꾸지 않음)", async () => {
    expect(await revertFailedStart(failed, thrown)).toEqual({ reverted: false, status: null });
    expect(await revertFailedStart(failed, failed)).toEqual({ reverted: false, status: null });
  });
});
