import { describe, expect, it } from "vitest";
import { mergeFeed, type DonationNote } from "./feed";
import type { Comment } from "./queries";

const comment = (id: string, at: string): Comment => ({
  id,
  broadcast_id: "b",
  author_id: "u",
  body: id,
  created_at: at,
  updated_at: at,
  author: { nickname: "시청자B" },
});
const donation = (id: string, at: string, message: string): DonationNote => ({
  id,
  amount: 5000,
  message,
  confirmed_at: at,
  donor: { nickname: "시청자B" },
});

describe("mergeFeed", () => {
  it("댓글과 후원을 시간순으로 섞는다", () => {
    const feed = mergeFeed(
      [comment("c1", "2026-11-19T10:00:00Z"), comment("c2", "2026-11-19T10:02:00Z")],
      [donation("d1", "2026-11-19T10:01:00Z", "화이팅")],
    );
    expect(feed.map((f) => (f.kind === "comment" ? f.comment.id : f.donation.id))).toEqual(["c1", "d1", "c2"]);
  });

  it("메시지 없는 후원은 댓글창에 넣지 않는다", () => {
    const feed = mergeFeed([], [donation("d1", "2026-11-19T10:01:00Z", ""), donation("d2", "2026-11-19T10:02:00Z", "  ")]);
    expect(feed).toEqual([]);
  });
});
