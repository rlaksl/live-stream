import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { DeleteBroadcastButton } from "@/features/broadcasts/delete-button";
import { OffAirScreen } from "@/features/broadcasts/off-air-screen";
import { findBroadcast } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import { CATEGORY_LABEL } from "@/features/broadcasts/types";
import { CommentPanel } from "@/features/comments/comment-panel";
import { listComments } from "@/features/comments/queries";
import { DonationPanel } from "@/features/donations/donation-panel";
import { FollowButton } from "@/features/follows/follow-button";
import { getFollowState } from "@/features/follows/queries";
import { listDonations } from "@/features/donations/queries";
import { LivePlayer } from "@/features/live/live-player";
import { findRecordingOfBroadcast } from "@/features/recordings/queries";

export default async function BroadcastPage({ params }: PageProps<"/broadcasts/[id]">) {
  const { id } = await params;
  const [broadcast, user, recording, comments, donations] = await Promise.all([
    findBroadcast(id),
    getCurrentUser(),
    findRecordingOfBroadcast(id),
    listComments(id),
    listDonations(id),
  ]);
  if (!broadcast) notFound();
  const isOwner = user?.id === broadcast.owner_id;
  const follow = await getFollowState(broadcast.owner_id, user?.id ?? null);

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
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {broadcast.owner.nickname} ·{" "}
              <Link href={`/broadcasts?category=${broadcast.category}`} className="hover:text-primary">
                {CATEGORY_LABEL[broadcast.category]}
              </Link>
            </p>
            <FollowButton
              broadcasterId={broadcast.owner_id}
              count={follow.count}
              following={follow.following}
              mode={!user ? "login" : isOwner ? "owner" : "ok"}
              loginNext={`/broadcasts/${id}`}
            />
          </div>
          {recording && <RecordingNotice id={recording.id} status={recording.status} />}
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

      <aside className="space-y-6">
        <CommentPanel broadcastId={id} currentUserId={user?.id ?? null} initialComments={comments} />
        <DonationPanel broadcastId={id} donate={!user ? "login" : isOwner ? "owner" : "ok"} initial={donations} />
      </aside>
    </div>
  );
}

function RecordingNotice({ id, status }: { id: string; status: "recording" | "ready" | "failed" }) {
  if (status === "ready") {
    return (
      <Link href={`/recordings/${id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        ▶ 녹화 다시보기
      </Link>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      {status === "recording" ? "● 녹화 중이거나 저장하는 중입니다." : "녹화 저장에 실패했습니다."}
    </p>
  );
}
