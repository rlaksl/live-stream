import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { CategoryChips } from "@/features/broadcasts/category-chips";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { CATEGORY_LABEL, type Broadcast } from "@/features/broadcasts/types";
import { FeaturedCarousel, type Slide } from "@/features/home/featured-carousel";
import { getViewerCounts } from "@/features/live/viewer-counts";
import { Mascot } from "@/features/mascot/mascot";
import { RecordingCard } from "@/features/recordings/recording-card";
import { formatDuration, listRecordings } from "@/features/recordings/queries";

/**
 * 홈: 대표 영상 캐러셀 + 소개 → 카테고리 → 방송 중 → 최근 다시보기.
 * 처음 온 사람이 바로 영상을 볼 수 있도록, 방송 중이 없어도 다시보기를 대표 영상으로 보여준다.
 */
export default async function HomePage() {
  const [live, recordings] = await Promise.all([listBroadcasts("live"), listRecordings(5)]);
  const viewerCounts = await getViewerCounts(live.map((b) => b.id));

  const slides: Slide[] = [
    ...live.slice(0, 5).map((b) => ({
      kind: "live" as const,
      href: `/broadcasts/${b.id}`,
      title: b.title,
      meta: `${b.owner.nickname} · ${CATEGORY_LABEL[b.category]}`,
      corner: `시청 ${viewerCounts.get(b.id) ?? 0}`,
    })),
    ...recordings.map((r) => ({
      kind: "replay" as const,
      href: `/recordings/${r.id}`,
      title: r.broadcast.title,
      meta: `${r.broadcast.owner.nickname} · 다시보기`,
      corner: formatDuration(r.started_at, r.ended_at),
      videoUrl: r.url,
    })),
  ];

  return (
    <div className="flex flex-col gap-12">
      <section aria-label="대표 방송" className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <FeaturedCarousel slides={slides} />
        <Intro replayHref={recordings[0] ? `/recordings/${recordings[0].id}` : "/recordings"} />
      </section>

      <CategoryChips basePath="/broadcasts" />

      <Section title="방송 중" more={{ href: "/broadcasts", label: "전체 보기" }}>
        <LiveGrid broadcasts={live} viewerCounts={viewerCounts} empty={<NoLive />} />
      </Section>

      <Section title="최근 다시보기" more={{ href: "/recordings", label: "다시보기 전체" }}>
        {recordings.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            저장된 녹화가 없습니다. 방송을 시작할 때 &apos;녹화하기&apos;를 켜면 다시보기에 저장됩니다.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] gap-6">
            {recordings.slice(0, 2).map((r) => (
              <RecordingCard key={r.id} recording={r} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Intro({ replayHref }: { replayHref: string }) {
  return (
    <div className="flex flex-col justify-center gap-6 rounded-sm border bg-card p-6 sm:p-8">
      {/* 랜딩: 통통 튀다 점점 작게 튀며 멈춘다 */}
      <Mascot face="happy" size={72} bounce />
      <h1 className="text-[40px] leading-tight font-bold">
        지금 켜면,
        <br />
        바로 방송.
      </h1>
      <p className="leading-relaxed text-muted-foreground">
        PC는 화면 공유와 탭 소리, 휴대폰은 카메라로. 설치 없이 브라우저에서 시작합니다.
      </p>
      <div className="flex flex-wrap gap-3">
        {/* 비로그인이면 방송 만들기 화면이 로그인으로 보내고, 로그인 후 다시 돌아온다 */}
        <Link href="/broadcasts/new" className={cn(buttonVariants(), "h-auto px-[22px] py-3.5 text-base font-bold")}>
          내 방송 시작
        </Link>
        <Link href={replayHref} className={cn(buttonVariants({ variant: "outline" }), "h-auto px-[22px] py-3.5 text-base")}>
          다시보기 재생
        </Link>
      </div>
      <p className="text-[13px] text-[#8a8a93]">로그인하지 않아도 시청할 수 있어요.</p>
    </div>
  );
}

/** 방송 중이 없을 때: 놀란 눈 마스코트 */
function NoLive() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-sm border bg-card px-8 py-10 text-center">
      <span className="font-pixel text-xs tracking-[2px] text-muted-foreground">NO LIVE</span>
      <Mascot face="surprised" size={120} />
      <h3 className="text-[22px] font-bold">지금 방송 중인 방송이 없어요</h3>
      <p className="text-muted-foreground">첫 번째로 켜 보세요. 아래에서 다시보기도 볼 수 있어요.</p>
      <Link href="/broadcasts/new" className={cn(buttonVariants(), "h-auto px-5 py-3 text-[15px] font-bold")}>
        내 방송 시작
      </Link>
    </div>
  );
}

function LiveGrid({
  broadcasts,
  viewerCounts,
  empty,
}: {
  broadcasts: Broadcast[];
  viewerCounts: Map<string, number>;
  empty: React.ReactNode;
}) {
  if (broadcasts.length === 0) return empty;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
      {broadcasts.map((b) => (
        <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts.get(b.id)} />
      ))}
    </div>
  );
}

function Section({
  title,
  more,
  children,
}: {
  title: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {more && (
          <Link href={more.href} className="text-sm text-primary hover:text-[#ffb066]">
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
