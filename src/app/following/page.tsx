import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcastsByOwners } from "@/features/broadcasts/queries";
import type { Broadcast } from "@/features/broadcasts/types";
import { listFollowedIds } from "@/features/follows/queries";
import { getViewerCounts } from "@/features/live/viewer-counts";
import { Mascot } from "@/features/mascot/mascot";

/** 팔로잉: 팔로우한 방송자의 방송 중 → 최근 방송. 로그인한 사용자만. */
export default async function FollowingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/following");

  const followedIds = await listFollowedIds(user.id);
  const broadcasts = await listBroadcastsByOwners([...followedIds]);
  const live = broadcasts.filter((b) => b.status === "live");
  const others = broadcasts.filter((b) => b.status !== "live");
  const viewerCounts = await getViewerCounts(live.map((b) => b.id));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold">팔로잉</h1>
        <p className="text-[15px] text-muted-foreground">팔로우한 방송자 {followedIds.size}명의 방송이에요.</p>
      </div>

      {followedIds.size === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Mascot face="surprised" size={120} />
          <p className="text-muted-foreground">
            아직 팔로우한 방송자가 없어요. 방송 화면에서 &apos;팔로우&apos;를 누르면 여기에 모여요.
          </p>
          <Link href="/broadcasts" className="text-sm text-primary">
            전체 방송 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <Section title="방송 중" broadcasts={live} viewerCounts={viewerCounts} empty="지금 방송 중인 방송자가 없어요." />
          <Section title="최근 방송" broadcasts={others} empty="아직 방송 기록이 없어요." />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  broadcasts,
  viewerCounts,
  empty,
}: {
  title: string;
  broadcasts: Broadcast[];
  viewerCounts?: Map<string, number>;
  empty: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl font-bold">{title}</h2>
      {broadcasts.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
          {broadcasts.map((b) => (
            <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts?.get(b.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
