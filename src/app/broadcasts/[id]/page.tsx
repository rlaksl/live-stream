import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { DeleteBroadcastButton } from "@/features/broadcasts/delete-button";
import { OffAirScreen } from "@/features/broadcasts/off-air-screen";
import { findBroadcast } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import { LivePlayer } from "@/features/live/live-player";

export default async function BroadcastPage({ params }: PageProps<"/broadcasts/[id]">) {
  const { id } = await params;
  const [broadcast, user] = await Promise.all([findBroadcast(id), getCurrentUser()]);
  if (!broadcast) notFound();
  const isOwner = user?.id === broadcast.owner_id;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0 space-y-4">
        {broadcast.status === "live" && <LivePlayer broadcastId={broadcast.id} />}
        {broadcast.status === "waiting" && <OffAirScreen face="sleepy" message="곧 방송을 시작합니다" />}
        {broadcast.status === "ended" && <OffAirScreen face="dead" message="방송이 종료되었습니다" />}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={broadcast.status} />
            <h1 className="text-xl font-bold break-all">{broadcast.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{broadcast.owner.nickname}</p>
          {broadcast.description && (
            <p className="text-sm whitespace-pre-wrap">{broadcast.description}</p>
          )}
        </div>

        {isOwner && (
          <div className="flex flex-wrap gap-2">
            {broadcast.status !== "ended" && (
              <Link href={`/broadcasts/${id}/studio`} className={buttonVariants({ size: "sm" })}>
                송출 화면
              </Link>
            )}
            <Link href={`/broadcasts/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              수정
            </Link>
            <DeleteBroadcastButton id={id} isLive={broadcast.status === "live"} />
          </div>
        )}
      </section>

      <aside className="space-y-6">{/* 댓글(티켓 08)·후원(티켓 09) */}</aside>
    </div>
  );
}
