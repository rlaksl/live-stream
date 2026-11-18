import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error";
import type { BroadcastStatus } from "./types";
import { assertCanEnd, assertCanPublish, assertCanRecord, assertCanStart, assertCanWatch, assertOwner } from "./policy";

const owner = { id: "owner", nickname: "방송자" };
const other = { id: "other", nickname: "다른사람" };
const broadcast = (status: BroadcastStatus) => ({ owner_id: owner.id, status });

/** 던진 AppError의 status, 통과하면 "ok" */
function result(fn: () => void) {
  try {
    fn();
    return "ok";
  } catch (error) {
    if (error instanceof AppError) return error.status;
    throw error;
  }
}

describe("방송 수정·삭제 (assertOwner)", () => {
  it("비로그인은 401", () => expect(result(() => assertOwner(null, broadcast("waiting")))).toBe(401));
  it("다른 사용자는 403", () => expect(result(() => assertOwner(other, broadcast("waiting")))).toBe(403));
  it("소유자는 허용", () => expect(result(() => assertOwner(owner, broadcast("waiting")))).toBe("ok"));
});

describe("방송 시작", () => {
  it("비로그인 401, 다른 사용자 403", () => {
    expect(result(() => assertCanStart(null, broadcast("waiting")))).toBe(401);
    expect(result(() => assertCanStart(other, broadcast("waiting")))).toBe(403);
  });
  it("소유자는 대기 상태에서만 시작", () => {
    expect(result(() => assertCanStart(owner, broadcast("waiting")))).toBe("ok");
    expect(result(() => assertCanStart(owner, broadcast("live")))).toBe(409);
    expect(result(() => assertCanStart(owner, broadcast("ended")))).toBe(409);
  });
});

describe("방송 종료", () => {
  it("비로그인 401, 다른 사용자 403", () => {
    expect(result(() => assertCanEnd(null, broadcast("live")))).toBe(401);
    expect(result(() => assertCanEnd(other, broadcast("live")))).toBe(403);
  });
  it("소유자는 방송 중에서만 종료", () => {
    expect(result(() => assertCanEnd(owner, broadcast("live")))).toBe("ok");
    expect(result(() => assertCanEnd(owner, broadcast("waiting")))).toBe(409);
    expect(result(() => assertCanEnd(owner, broadcast("ended")))).toBe(409);
  });
});

describe("LiveKit 송출 토큰 (canPublish)", () => {
  it.each([
    ["비로그인", null, "live", 401],
    ["다른 사용자", other, "live", 403],
    ["소유자 · 대기", owner, "waiting", 409],
    ["소유자 · 종료", owner, "ended", 409],
    ["소유자 · 방송 중", owner, "live", "ok"],
  ] as const)("%s → %s", (_, user, status, expected) => {
    expect(result(() => assertCanPublish(user, broadcast(status)))).toBe(expected);
  });
});

describe("LiveKit 시청 토큰 (구독 전용)", () => {
  it("방송 중이면 누구나 허용", () => expect(result(() => assertCanWatch(broadcast("live")))).toBe("ok"));
  it("대기·종료는 409", () => {
    expect(result(() => assertCanWatch(broadcast("waiting")))).toBe(409);
    expect(result(() => assertCanWatch(broadcast("ended")))).toBe(409);
  });
});

describe("녹화 시작·중지", () => {
  const live = (record_enabled: boolean) => ({ ...broadcast("live"), record_enabled });
  it("비로그인 401, 다른 사용자 403", () => {
    expect(result(() => assertCanRecord(null, live(true)))).toBe(401);
    expect(result(() => assertCanRecord(other, live(true)))).toBe(403);
  });
  it("소유자 · 방송 중 · 녹화 켬만 허용", () => {
    expect(result(() => assertCanRecord(owner, live(true)))).toBe("ok");
    expect(result(() => assertCanRecord(owner, live(false)))).toBe(409);
    expect(result(() => assertCanRecord(owner, { ...broadcast("ended"), record_enabled: true }))).toBe(409);
  });
});
