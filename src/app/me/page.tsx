import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { DeleteBroadcastButton } from "@/features/broadcasts/delete-button";
import { listBroadcastsByOwners } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import { CATEGORY_LABEL } from "@/features/broadcasts/types";
import { won } from "@/features/donations/policy";
import { listReceivedDonations, listSentDonations } from "@/features/donations/queries";
import { totalsByBroadcast, type DonationRecord } from "@/features/donations/totals";
import { listFollowers, listFollowing } from "@/features/follows/queries";
import { UnfollowButton } from "@/features/follows/unfollow-button";
import { followerGrowth } from "@/features/follows/growth";
import { GrowthChart } from "@/features/follows/growth-chart";
import { listMyRecordingPlays } from "@/features/recordings/queries";

/** 마이페이지: 내 방송, 받은·한 후원, 팔로워·팔로잉. 로그인한 본인 데이터만 서버에서 읽는다. */
export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");

  const [broadcasts, received, sent, followers, following, plays] = await Promise.all([
    listBroadcastsByOwners([user.id]),
    listReceivedDonations(user.id),
    listSentDonations(user.id),
    listFollowers(user.id),
    listFollowing(user.id),
    listMyRecordingPlays(user.id),
  ]);
  // 0007 이전 방송·녹화는 기록이 없어 0이므로, 기록이 생긴 것만 보여준다
  const peaks = broadcasts
    .filter((b) => b.peak_viewers > 0)
    .map((b) => ({ id: b.id, label: b.title, value: b.peak_viewers }));
  const playRows = plays
    .filter((r) => r.play_count > 0)
    .map((r) => ({ id: r.id, label: `${r.broadcast.title} · ${formatDate(r.started_at)}`, value: r.play_count }));
  const receivedTotal = received.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold">마이페이지</h1>
        <p className="text-[15px] text-muted-foreground">
          {user.nickname} · 팔로워 {followers.length}명 · 팔로잉 {following.length}명
        </p>
      </div>

      <Section title={`내 방송 ${broadcasts.length}`}>
        {broadcasts.length === 0 ? (
          <Empty>
            아직 방송이 없어요.{" "}
            <Link href="/broadcasts/new" className="text-primary">
              첫 방송 만들기
            </Link>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y rounded-sm border bg-card">
            {broadcasts.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                <StatusBadge status={b.status} />
                <Link href={`/broadcasts/${b.id}`} className="min-w-0 flex-1 basis-48 truncate font-medium hover:text-primary">
                  {b.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {CATEGORY_LABEL[b.category]} · {formatDate(b.created_at)}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/broadcasts/${b.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    수정
                  </Link>
                  <DeleteBroadcastButton id={b.id} isLive={b.status === "live"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="받은 후원">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm text-muted-foreground">전체 합계</span>
          <strong className="text-2xl text-primary">{won(receivedTotal)}</strong>
          <span className="text-[13px] text-[#8a8a93]">테스트 결제, 실제 정산 없음</span>
        </div>
        {received.length === 0 ? (
          <Empty>아직 받은 후원이 없어요.</Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Box title="방송별 합계">
              {totalsByBroadcast(received).map((t) => (
                <Row key={t.broadcastId ?? "deleted"} left={`${t.title} (${t.count}건)`} right={won(t.total)} />
              ))}
            </Box>
            <Box title="내역">
              <DonationRows records={received} />
            </Box>
          </div>
        )}
      </Section>

      <Section title="내가 한 후원">
        {sent.length === 0 ? (
          <Empty>아직 후원한 적이 없어요.</Empty>
        ) : (
          <Box title={`합계 ${won(sent.reduce((sum, d) => sum + d.amount, 0))}`}>
            <DonationRows records={sent} />
          </Box>
        )}
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title={`팔로워 ${followers.length}`}>
          {followers.length === 0 ? (
            <Empty>아직 팔로워가 없어요. 팔로워 목록은 나만 볼 수 있어요.</Empty>
          ) : (
            <Box title="나만 볼 수 있어요">
              {followers.map((f) => (
                <Row key={f.id} left={f.nickname} right={`${formatDate(f.since)}부터`} />
              ))}
            </Box>
          )}
        </Section>
        <Section title={`팔로잉 ${following.length}`}>
          {following.length === 0 ? (
            <Empty>아직 팔로우한 방송자가 없어요.</Empty>
          ) : (
            <ul className="flex flex-col divide-y rounded-sm border bg-card">
              {following.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>{f.nickname}</span>
                  <UnfollowButton broadcasterId={f.id} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="통계">
        {followers.length === 0 ? (
          <Empty>팔로워가 생기면 날짜별 증가 그래프가 여기에 보여요.</Empty>
        ) : (
          <GrowthChart
            points={followerGrowth(
              followers.map((f) => f.since),
              14,
              new Date(),
            )}
          />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <StatBars
            title="방송별 최고 시청자 수"
            unit="명"
            rows={peaks}
            empty="시청자가 들어온 방송이 생기면 여기에 보여요."
          />
          <StatBars title="다시보기 재생 수" unit="회" rows={playRows} empty="다시보기가 재생되면 여기에 보여요." />
        </div>
      </Section>
    </div>
  );
}

function DonationRows({ records }: { records: DonationRecord[] }) {
  return records.map((d) => (
    <Row
      key={d.id}
      left={
        <>
          <span className="font-medium">{d.other.nickname}</span>
          <span className="text-muted-foreground"> · {d.broadcast?.title ?? "삭제된 방송"}</span>
          {d.message && <span className="block text-[13px] text-muted-foreground">&ldquo;{d.message}&rdquo;</span>}
        </>
      }
      right={won(d.amount)}
    />
  ));
}

/** 항목별 값 막대(한 계열이라 범례 없이 제목이 이름). 값은 막대 옆 글자로 늘 보인다. */
function StatBars({
  title,
  unit,
  rows,
  empty,
}: {
  title: string;
  unit: string;
  rows: { id: string; label: string; value: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3 rounded-sm border bg-card p-5">
      <h3 className="font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 text-sm">
              <span className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{r.label}</span>
                <span className="shrink-0 font-bold">
                  {r.value.toLocaleString("ko-KR")}
                  {unit}
                </span>
              </span>
              <span className="h-2 rounded-r-[4px] bg-primary/80" style={{ width: `${(r.value / max) * 100}%` }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border bg-card p-5">
      <h3 className="text-sm font-bold text-muted-foreground">{title}</h3>
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">{children}</ul>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: string }) {
  return (
    <li className="flex justify-between gap-3 text-sm">
      <span className="min-w-0">{left}</span>
      <span className="shrink-0 text-primary">{right}</span>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}
