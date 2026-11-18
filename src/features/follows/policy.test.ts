import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error";
import { assertCanFollow, assertCanUnfollow } from "./policy";

const me = { id: "me", nickname: "나" };

function result(fn: () => void) {
  try {
    fn();
    return "ok";
  } catch (error) {
    if (error instanceof AppError) return error.status;
    throw error;
  }
}

describe("팔로우", () => {
  it("비로그인은 401", () => expect(result(() => assertCanFollow(null, "other"))).toBe(401));
  it("자기 자신은 409", () => expect(result(() => assertCanFollow(me, "me"))).toBe(409));
  it("다른 방송자는 허용", () => expect(result(() => assertCanFollow(me, "other"))).toBe("ok"));
});

describe("언팔로우", () => {
  it("비로그인은 401", () => expect(result(() => assertCanUnfollow(null))).toBe(401));
  it("로그인하면 허용(자기 팔로우만 지운다)", () => expect(result(() => assertCanUnfollow(me))).toBe("ok"));
});
