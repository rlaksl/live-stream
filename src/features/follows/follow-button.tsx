"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { follow, unfollow } from "./actions";

type Props = {
  broadcasterId: string;
  count: number;
  following: boolean;
  /** login: 비로그인(로그인으로 보냄), owner: 내 방송(수만 표시), ok: 팔로우 가능 */
  mode: "login" | "owner" | "ok";
  loginNext: string;
};

export function FollowButton({ broadcasterId, count, following, mode, loginNext }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label = `팔로워 ${count}명`;

  if (mode === "owner") return <span className="text-sm text-muted-foreground">{label}</span>;

  if (mode === "login") {
    return (
      <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
        ♡ 팔로우 · {count}
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
    <Button size="sm" variant={following ? "secondary" : "outline"} disabled={pending} onClick={toggle}>
      {following ? "♥ 팔로잉" : "♡ 팔로우"} · {count}
    </Button>
  );
}
