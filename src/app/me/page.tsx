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

/** 마이페이지: 내 방송, 받은·한 후원, 팔로워·팔로잉. 로그인한 본인 데이터만 서버에서 읽는다. */
export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/me");

  const [broadcasts, received, sent, followers, following] = await Promise.all([
    listBroadcastsByOwners([user.id]),
    listReceivedDonations(user.id),
    listSentDonations(user.id),
    listFollowers(user.id),
    listFollowing(user.id),
  ]);
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
                <Link href={`/broadcasts/${b.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
                  {b.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {CATEGORY_LABEL[b.category]} · {formatDate(b.created_at)}
                </span>
                <div className="flex gap-2">
                  <Link href={`/broadcasts/${b.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
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
