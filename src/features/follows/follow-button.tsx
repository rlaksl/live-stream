"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { follow, unfollow } from "./actions";

type Props = {
  broadcasterId: string;
  following: boolean;
  /** login: 비로그인(로그인으로 보냄), owner: 내 방송(버튼 없음), ok: 팔로우 가능 */
  mode: "login" | "owner" | "ok";
  loginNext: string;
};

const style = "h-auto px-[18px] py-3 text-[15px]";

/** 팔로우 버튼. 팔로워 수는 방송자 정보 옆에 따로 표시한다. */
export function FollowButton({ broadcasterId, following, mode, loginNext }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (mode === "owner") return null;

  if (mode === "login") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(loginNext)}`}
        className={cn(buttonVariants({ variant: "outline" }), style)}
      >
        팔로우
      </Link>
    );
  }

  function toggle() {
    startTransition(async () => {
      const result = following ? await unfollow(broadcasterId) : await follow(broadcasterId);
      if ("error" in result) toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={toggle}
      className={cn(style, following && "border-primary text-primary")}
    >
      {following ? "팔로잉" : "팔로우"}
    </Button>
  );
}
