import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { findBroadcast } from "@/features/broadcasts/queries";
import { StatusBadge } from "@/features/broadcasts/status-badge";
import { Studio } from "@/features/live/studio";

export default async function StudioPage({ params }: PageProps<"/broadcasts/[id]/studio">) {
  const { id } = await params;
  const [broadcast, user] = await Promise.all([findBroadcast(id), getCurrentUser()]);
  if (!broadcast) notFound();
  // 화면 접근 제한은 편의일 뿐이고, 실제 권한 확인은 송출 서버 액션(토큰 발급)이 한다
  if (!user) redirect(`/login?next=/broadcasts/${id}/studio`);
  if (user.id !== broadcast.owner_id) redirect(`/broadcasts/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-bold">방송하기</h1>
        <StatusBadge status={broadcast.status} />
        <Link href={`/broadcasts/${id}`} className="ml-auto text-sm text-primary">
          시청 화면 보기
        </Link>
      </div>
      <Studio broadcastId={id} initialStatus={broadcast.status} info={broadcast} />
    </div>
  );
}
