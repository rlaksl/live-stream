import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WatchAside } from "@/features/broadcasts/watch-aside";
import { DonationAlert } from "@/features/donations/donation-alert";
import { getCurrentUser } from "@/features/auth/current-user";
import { DeleteBroadcastButton } from "@/features/broadcasts/delete-button";
import { OffAirScreen } from "@/features/broadcasts/off-air-screen";
import { findBroadcast } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import { formatKst } from "@/features/broadcasts/schedule";
import { CATEGORY_LABEL } from "@/features/broadcasts/types";
import { listComments } from "@/features/comments/queries";
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

  const followMode = !user ? "login" : isOwner ? "owner" : "ok";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
      <section aria-label="플레이어" className="flex min-w-0 flex-col gap-5">
        {/* 후원 알림 배너는 플레이어(또는 대기·종료 화면) 위에 겹쳐 띄운다 */}
        <div className="relative">
          {broadcast.status === "live" && <LivePlayer broadcastId={broadcast.id} />}
          {broadcast.status === "waiting" && (
            <OffAirScreen
              face="sleepy"
              label="대기 중"
              title="곧 시작합니다"
              message={
                <>
                  방송자가 아직 송출을 시작하지 않았어요.
                  {broadcast.scheduled_at && (
                    <>
                      <br />
                      예정 {formatKst(broadcast.scheduled_at)}
                    </>
                  )}
                </>
              }
            />
          )}
          {broadcast.status === "ended" && (
            <OffAirScreen
              face="dead"
              label="NO SIGNAL"
              title="방송이 종료되었습니다"
              message={
                recording?.status === "ready"
                  ? "녹화된 방송은 다시보기에서 볼 수 있어요."
                  : "다음 방송을 기다려 주세요."
              }
            >
              {recording?.status === "ready" && (
                <Link
                  href={`/recordings/${recording.id}`}
                  className={cn(buttonVariants(), "h-auto px-5 py-3 text-[15px] font-bold")}
                >
                  다시보기 재생
                </Link>
              )}
            </OffAirScreen>
          )}
          <DonationAlert broadcastId={broadcast.id} />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl font-bold">{broadcast.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {broadcast.status !== "live" && <StatusBadge status={broadcast.status} />}
              <Link
                href={`/broadcasts?category=${broadcast.category}`}
                className="rounded-full bg-secondary px-2.5 py-1 text-[#d4d4d8] hover:text-foreground"
              >
                {CATEGORY_LABEL[broadcast.category]}
              </Link>
              {broadcast.started_at && <span>시작 {formatTime(broadcast.started_at)}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <FollowButton
              broadcasterId={broadcast.owner_id}
              following={follow.following}
              mode={followMode}
              loginNext={`/broadcasts/${id}`}
            />
            {followMode !== "owner" && (
              <Link
                href={user ? `/broadcasts/${id}/donate` : `/login?next=/broadcasts/${id}/donate`}
                className={cn(buttonVariants(), "h-auto px-[18px] py-3 text-[15px] font-bold")}
              >
                후원하기
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-sm border bg-card p-4">
          <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-[#2a2a30] font-bold">
            {broadcast.owner.nickname.slice(0, 1)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{broadcast.owner.nickname}</span>
            <span className="text-[13px] text-muted-foreground">팔로워 {follow.count}명</span>
          </div>
        </div>

        {recording && recording.status !== "ready" && <RecordingNotice status={recording.status} />}
        {broadcast.description && <p className="text-sm whitespace-pre-wrap">{broadcast.description}</p>}

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

      <WatchAside
        broadcastId={id}
        ownerId={broadcast.owner_id}
        currentUserId={user?.id ?? null}
        initialComments={comments}
        initialDonations={donations}
      />
    </div>
  );
}

/** 방송 시작 시각(KST) HH:mm */
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function RecordingNotice({ status }: { status: "recording" | "failed" }) {
  return (
    <p className="text-sm text-muted-foreground">
      {status === "recording" ? "● 녹화 중이거나 저장하는 중입니다." : "녹화 저장에 실패했습니다."}
    </p>
  );
}
