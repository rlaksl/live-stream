import type { Comment } from "./queries";

/** 댓글창에 섞어 보여줄 확정 후원(메시지가 있는 것만). 수정·삭제할 수 없다. */
export type DonationNote = {
  id: string;
  amount: number;
  message: string;
  confirmed_at: string;
  donor: { nickname: string };
};

export type FeedItem = { kind: "comment"; at: string; comment: Comment } | { kind: "donation"; at: string; donation: DonationNote };

/** 댓글과 메시지 있는 후원을 시간순(오래된 것 먼저)으로 합친다 */
export function mergeFeed(comments: Comment[], donations: DonationNote[]): FeedItem[] {
  const items: FeedItem[] = [
    ...comments.map((comment) => ({ kind: "comment" as const, at: comment.created_at, comment })),
    ...donations
      .filter((d) => d.message.trim() !== "")
      .map((donation) => ({ kind: "donation" as const, at: donation.confirmed_at, donation })),
  ];
  return items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
