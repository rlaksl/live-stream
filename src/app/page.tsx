import Link from "next/link";
import { cn } from "@/lib/utils";
import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { getViewerCounts } from "@/features/live/viewer-counts";
import { Mascot } from "@/features/mascot/mascot";

const TABS = [
  { key: "live", label: "방송 중" },
  { key: "all", label: "전체 방송" },
  { key: "replays", label: "다시보기" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { tab: tabParam } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "live";

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-3 py-6 text-center">
        <Mascot face="happy" size={140} bounce />
        <p className="text-muted-foreground">PC 화면도, 휴대폰 카메라도 지금 바로 방송하세요.</p>
      </section>

      <nav className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/?tab=${t.key}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              t.key === tab ? "border-primary font-bold text-primary" : "border-transparent text-muted-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "replays" ? <p className="text-muted-foreground">녹화가 아직 없습니다.</p> : <BroadcastList filter={tab} />}
    </div>
  );
}

async function BroadcastList({ filter }: { filter: "live" | "all" }) {
  const broadcasts = await listBroadcasts(filter);
  const viewerCounts = await getViewerCounts(broadcasts.filter((b) => b.status === "live").map((b) => b.id));

  if (broadcasts.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {filter === "live" ? "지금 방송 중인 방송이 없습니다." : "등록된 방송이 없습니다."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {broadcasts.map((b) => (
        <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts.get(b.id)} />
      ))}
    </div>
  );
}
