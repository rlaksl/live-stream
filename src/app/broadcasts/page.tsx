import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { CategoryChips } from "@/features/broadcasts/category-chips";
import { CATEGORY_LABEL, isCategory } from "@/features/broadcasts/types";
import { getViewerCounts } from "@/features/live/viewer-counts";

/** 전체 방송(대기·방송 중·종료) 최신순. ?category=game 처럼 카테고리로 거른다. */
export default async function BroadcastsPage({ searchParams }: PageProps<"/broadcasts">) {
  const { category: param } = await searchParams;
  const category = isCategory(param) ? param : undefined;
  const broadcasts = await listBroadcasts("all", category);
  const viewerCounts = await getViewerCounts(broadcasts.filter((b) => b.status === "live").map((b) => b.id));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-bold">전체 방송</h1>
      <CategoryChips basePath="/broadcasts" active={category} />
      {broadcasts.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {category ? `'${CATEGORY_LABEL[category]}' 카테고리에 방송이 없습니다.` : "등록된 방송이 없습니다."}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
          {broadcasts.map((b) => (
            <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts.get(b.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

