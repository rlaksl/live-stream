"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unfollow } from "./actions";

/** 마이페이지 팔로잉 목록의 팔로우 취소 */
export function UnfollowButton({ broadcasterId }: { broadcasterId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await unfollow(broadcasterId);
          if ("error" in result) toast.error(result.error);
          router.refresh();
        })
      }
    >
      팔로우 취소
    </Button>
  );
}
