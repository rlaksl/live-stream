import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listBroadcasts } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import type { Broadcast } from "@/features/broadcasts/types";
import { getViewerCounts } from "@/features/live/viewer-counts";
import { Mascot } from "@/features/mascot/mascot";
import { RecordingCard } from "@/features/recordings/recording-card";
import { RecordingThumbnail } from "@/features/recordings/recording-thumbnail";
import { listRecordings } from "@/features/recordings/queries";

/**
 * 홈: 대표 영상 → 방송 중 → 최근 다시보기.
 * 처음 온 사람이 바로 영상을 볼 수 있도록, 방송 중이 없으면 최근 녹화를 대표 영상으로 보여준다.
 */
export default async function HomePage() {
  const [live, recordings] = await Promise.all([listBroadcasts("live"), listRecordings(6)]);
  const viewerCounts = await getViewerCounts(live.map((b) => b.id));

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 lg:grid-cols-[1fr_280px]">
        <Featured live={live[0]} recording={recordings[0]} />
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <Mascot face="happy" size={96} bounce className="hidden lg:block" />
          <p className="text-muted-foreground">PC 화면도, 휴대폰 카메라도 지금 바로 방송하세요.</p>
          {/* 비로그인이면 방송 만들기 화면이 로그인으로 보내고, 로그인 후 다시 돌아온다 */}
          <Link href="/broadcasts/new" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            내 방송 시작
          </Link>
        </div>
      </section>

      <Section title="방송 중" more={{ href: "/broadcasts", label: "전체 방송 보기" }}>
        {live.length === 0 ? (
          <Empty>지금 방송 중인 방송이 없습니다.</Empty>
        ) : (
          <Grid>
            {live.map((b) => (
              <BroadcastCard key={b.id} broadcast={b} viewers={viewerCounts.get(b.id)} />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="최근 다시보기">
        {recordings.length === 0 ? (
          <Empty>저장된 녹화가 없습니다. 방송을 시작할 때 &apos;녹화하기&apos;를 켜면 다시보기에 저장됩니다.</Empty>
        ) : (
          <Grid>
            {recordings.map((r) => (
              <RecordingCard key={r.id} recording={r} />
            ))}
          </Grid>
        )}
      </Section>
    </div>
  );
}

function Featured({
  live,
  recording,
}: {
  live?: Broadcast;
  recording?: Awaited<ReturnType<typeof listRecordings>>[number];
}) {
  const frame = "relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border bg-black";

  if (live) {
    return (
      <Link href={`/broadcasts/${live.id}`} className="group block space-y-2">
        <div className={frame}>
          <Mascot face="happy" size={140} />
          <StatusBadge status="live" className="absolute top-3 left-3" />
          <PlayLabel>LIVE · 시청하기</PlayLabel>
        </div>
        <Caption title={live.title} nickname={live.owner.nickname} />
      </Link>
    );
  }

  if (recording) {
    return (
      <Link href={`/recordings/${recording.id}`} className="group block space-y-2">
        <div className={frame}>
          <RecordingThumbnail src={recording.url} mascotSize={140} />
          <PlayLabel>▶ 다시보기 재생</PlayLabel>
        </div>
        <Caption title={recording.broadcast.title} nickname={recording.broadcast.owner.nickname} />
      </Link>
    );
  }

  return (
    <div className={cn(frame, "flex-col gap-4")}>
      <Mascot face="happy" size={140} bounce />
      <p className="text-sm text-muted-foreground">아직 방송이 없습니다. 첫 방송을 시작해 보세요.</p>
    </div>
  );
}

function PlayLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-3 left-3 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground transition group-hover:scale-105">
      {children}
    </span>
  );
}

function Caption({ title, nickname }: { title: string; nickname: string }) {
  return (
    <div>
      <p className="truncate text-lg font-bold group-hover:text-primary">{title}</p>
      <p className="text-sm text-muted-foreground">{nickname}</p>
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
    <section className="space-y-4">
      <div className="flex items-baseline justify-between border-b pb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {more && (
          <Link href={more.href} className="text-sm text-primary underline">
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
