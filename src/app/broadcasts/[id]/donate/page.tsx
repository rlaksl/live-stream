import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { findBroadcast } from "@/features/broadcasts/queries";
import { DonateForm } from "@/features/donations/donate-form";

export default async function DonatePage({ params }: PageProps<"/broadcasts/[id]/donate">) {
  const { id } = await params;
  const [broadcast, user] = await Promise.all([findBroadcast(id), getCurrentUser()]);
  if (!broadcast) notFound();
  // 화면 접근 제한은 편의일 뿐이고, 실제 권한 확인은 createDonation 서버 액션이 한다
  if (!user) redirect(`/login?next=/broadcasts/${id}/donate`);
  if (user.id === broadcast.owner_id) redirect(`/broadcasts/${id}`);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{broadcast.owner.nickname}님에게 후원</h1>
        <p className="text-sm break-all text-muted-foreground">{broadcast.title}</p>
      </div>
      <DonateForm broadcastId={id} appUrl={process.env.APP_URL!} />
    </div>
  );
}
