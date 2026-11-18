import Link from "next/link";
import { cn } from "@/lib/utils";
import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { CATEGORIES, CATEGORY_LABEL, isCategory } from "@/features/broadcasts/types";
import { getViewerCounts } from "@/features/live/viewer-counts";

/** 전체 방송(대기·방송 중·종료) 최신순. ?category=game 처럼 카테고리로 거른다. */
export default async function BroadcastsPage({ searchParams }: PageProps<"/broadcasts">) {
  const { category: param } = await searchParams;
  const category = isCategory(param) ? param : undefined;
  const broadcasts = await listBroadcasts("all", category);
  const viewerCounts = await getViewerCounts(broadcasts.filter((b) => b.status === "live").map((b) => b.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 방송</h1>
      <nav className="flex flex-wrap gap-2" aria-label="카테고리">
        <CategoryChip href="/broadcasts" active={!category}>
          전체
        </CategoryChip>
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} href={`/broadcasts?category=${c}`} active={category === c}>
            {CATEGORY_LABEL[c]}
          </CategoryChip>
        ))}
      </nav>
      {broadcasts.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {category ? `'${CATEGORY_LABEL[category]}' 카테고리에 방송이 없습니다.` : "등록된 방송이 없습니다."}
        </p>
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

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-sm",
        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary/60",
      )}
    >
      {children}
    </Link>
  );
}
