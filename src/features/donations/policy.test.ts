import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error";
import { assertCanDonate, parseDonationInput } from "./policy";

const streamer = { id: "streamer", nickname: "방송자" };
const viewer = { id: "viewer", nickname: "시청자" };
const broadcast = { owner_id: streamer.id };

function result(fn: () => void) {
  try {
    fn();
    return "ok";
  } catch (error) {
    if (error instanceof AppError) return error.status;
    throw error;
  }
}

describe("후원 권한", () => {
  it("비로그인은 401", () => expect(result(() => assertCanDonate(null, broadcast))).toBe(401));
  it("자기 방송은 403", () => expect(result(() => assertCanDonate(streamer, broadcast))).toBe(403));
  it("다른 사용자의 방송은 허용", () => expect(result(() => assertCanDonate(viewer, broadcast))).toBe("ok"));
});

describe("후원 입력", () => {
  const parse = (amount: number, message = "") => result(() => parseDonationInput({ amount, message }));

  it("1,000원 이상 정수는 허용", () => {
    expect(parse(1000)).toBe("ok");
    expect(parse(12345, "응원합니다")).toBe("ok");
  });
  it("1,000원 미만은 400", () => expect(parse(999)).toBe(400));
  it("소수는 400", () => expect(parse(1000.5)).toBe(400));
  it("메시지 100자 초과는 400", () => expect(parse(1000, "가".repeat(101))).toBe(400));
});
