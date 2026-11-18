import { describe, expect, it } from "vitest";
import { followerGrowth } from "./growth";

describe("followerGrowth", () => {
  const now = new Date("2026-11-19T03:00:00Z"); // KST 11/19 12:00

  it("최근 n일 날짜별 누적 수를 KST 기준으로 만든다", () => {
    const since = [
      "2026-11-10T00:00:00Z", // 기간 이전 → 첫날 누적에 포함
      "2026-11-17T16:00:00Z", // UTC로는 17일이지만 KST 11/18 01:00
      "2026-11-19T01:00:00Z",
    ];
    expect(followerGrowth(since, 3, now)).toEqual([
      { date: "2026-11-17", label: "11/17", total: 1, added: 0 },
      { date: "2026-11-18", label: "11/18", total: 2, added: 1 },
      { date: "2026-11-19", label: "11/19", total: 3, added: 1 },
    ]);
  });

  it("팔로워가 없으면 모두 0", () => {
    expect(followerGrowth([], 2, now).map((p) => p.total)).toEqual([0, 0]);
  });
});
