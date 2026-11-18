import { describe, expect, it } from "vitest";
import { pickNewDonations } from "./new-donations";
import type { DonationItem } from "./queries";

const item = (id: string): DonationItem => ({
  id,
  amount: 1000,
  message: "",
  confirmed_at: "2026-11-19T00:00:00Z",
  donor: { nickname: "시청자B" },
});

describe("pickNewDonations", () => {
  it("본 적 없는 후원만 오래된 순으로 고른다", () => {
    // 목록은 최신순: d3이 가장 최근
    expect(pickNewDonations(new Set(["d1"]), [item("d3"), item("d2"), item("d1")]).map((d) => d.id)).toEqual([
      "d2",
      "d3",
    ]);
  });

  it("새 후원이 없으면 빈 배열", () => {
    expect(pickNewDonations(new Set(["d1", "d2"]), [item("d2"), item("d1")])).toEqual([]);
  });
});
