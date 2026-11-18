"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { won } from "./policy";
import type { DonationSummary } from "./queries";

const POLL_MS = 5000;

type Props = {
  broadcastId: string;
  /** login: 비로그인, owner: 자기 방송, ok: 후원 가능 */
  donate: "login" | "owner" | "ok";
  initial: DonationSummary;
};

/** 방송 상세의 확정 후원 내역과 합계. 몇 초마다 다시 불러온다. */
export function DonationPanel({ broadcastId, donate, initial }: Props) {
  const [summary, setSummary] = useState(initial);

  useEffect(() => {
    const timer = setInterval(async () => {
      const res = await fetch(`/api/broadcasts/${broadcastId}/donations`, { cache: "no-store" });
      if (res.ok) setSummary(await res.json());
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [broadcastId]);

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-bold">후원 {summary.items.length}</h2>
        <p className="text-sm">
          합계 <span className="font-bold text-primary">{won(summary.total)}</span>
        </p>
      </div>
      <ul className="max-h-60 space-y-3 overflow-y-auto px-4 py-3">
        {summary.items.length === 0 && <li className="text-sm text-muted-foreground">아직 후원이 없습니다.</li>}
        {summary.items.map((d) => (
          <li key={d.id} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-bold">{d.donor.nickname}</span>
              <span className="font-bold text-primary">{won(d.amount)}</span>
            </div>
            {d.message && <p className="mt-0.5 whitespace-pre-wrap">{d.message}</p>}
          </li>
        ))}
      </ul>
      <div className="border-t p-3">
        {donate === "ok" && (
          <Link href={`/broadcasts/${broadcastId}/donate`} className={buttonVariants({ className: "w-full" })}>
            후원하기
          </Link>
        )}
        {donate === "login" && (
          <Link
            href={`/login?next=/broadcasts/${broadcastId}/donate`}
            className="block text-center text-sm text-primary underline"
          >
            로그인하고 후원하기
          </Link>
        )}
        {donate === "owner" && (
          <p className="text-center text-sm text-muted-foreground">내 방송에는 후원할 수 없습니다.</p>
        )}
      </div>
    </section>
  );
}
