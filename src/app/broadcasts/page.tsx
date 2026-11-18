import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { getViewerCounts } from "@/features/live/viewer-counts";

/** 전체 방송(대기·방송 중·종료) 최신순 */
export default async function BroadcastsPage() {
  const broadcasts = await listBroadcasts("all");
  const viewerCounts = await getViewerCounts(broadcasts.filter((b) => b.status === "live").map((b) => b.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 방송</h1>
      {broadcasts.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">등록된 방송이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {broadcasts.map((b) => (
            <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts.get(b.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
