"use client";

import { useEffect, useState } from "react";
import { CommentPanel } from "@/features/comments/comment-panel";
import type { Comment } from "@/features/comments/queries";
import { DonationPanel } from "@/features/donations/donation-panel";
import type { DonationSummary } from "@/features/donations/queries";

const DONATION_POLL_MS = 5000;

type Props = {
  broadcastId: string;
  ownerId: string;
  currentUserId: string | null;
  initialComments: Comment[];
  initialDonations: DonationSummary;
};

/** 방송 상세 오른쪽(모바일은 아래): 후원 합계·내역 위, 댓글(후원 메시지 포함) 아래. 후원은 여기서 한 번만 폴링한다. */
export function WatchAside({ broadcastId, ownerId, currentUserId, initialComments, initialDonations }: Props) {
  const [donations, setDonations] = useState(initialDonations);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/broadcasts/${broadcastId}/donations`, { cache: "no-store" });
      if (res.ok) setDonations(await res.json());
    }, DONATION_POLL_MS);
    return () => clearInterval(timer);
  }, [broadcastId]);

  return (
    <aside aria-label="후원과 댓글" className="flex flex-col gap-4">
      <DonationPanel summary={donations} />
      <CommentPanel
        broadcastId={broadcastId}
        ownerId={ownerId}
        currentUserId={currentUserId}
        initialComments={initialComments}
        donations={donations.items}
      />
    </aside>
  );
}
