import { describe, expect, it } from "vitest";
import { totalsByBroadcast, type DonationRecord } from "./totals";

const record = (id: string, amount: number, broadcast: DonationRecord["broadcast"]): DonationRecord => ({
  id,
  amount,
  message: "",
  confirmed_at: "2026-11-19T00:00:00Z",
  broadcast,
  other: { nickname: "시청자B" },
});

describe("totalsByBroadcast", () => {
  it("방송별로 합치고 큰 금액 순으로 정렬한다", () => {
    const a = { id: "a", title: "방송 A" };
    const b = { id: "b", title: "방송 B" };
    expect(totalsByBroadcast([record("1", 1000, a), record("2", 5000, b), record("3", 10000, a)])).toEqual([
      { broadcastId: "a", title: "방송 A", total: 11000, count: 2 },
      { broadcastId: "b", title: "방송 B", total: 5000, count: 1 },
    ]);
  });

  it("삭제된 방송의 후원은 '삭제된 방송' 하나로 묶는다", () => {
    expect(totalsByBroadcast([record("1", 1000, null), record("2", 2000, null)])).toEqual([
      { broadcastId: null, title: "삭제된 방송", total: 3000, count: 2 },
    ]);
  });
});
