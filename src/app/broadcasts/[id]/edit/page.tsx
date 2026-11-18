import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { updateBroadcast } from "@/features/broadcasts/actions";
import { BroadcastForm } from "@/features/broadcasts/broadcast-form";
import { findBroadcast } from "@/features/broadcasts/queries";

export default async function EditBroadcastPage({ params }: PageProps<"/broadcasts/[id]/edit">) {
  const { id } = await params;
  const [broadcast, user] = await Promise.all([findBroadcast(id), getCurrentUser()]);
  if (!broadcast) notFound();
  // 화면 접근 제한은 편의일 뿐이고, 실제 권한 확인은 updateBroadcast 서버 액션이 한다
  if (!user) redirect(`/login?next=/broadcasts/${id}/edit`);
  if (user.id !== broadcast.owner_id) redirect(`/broadcasts/${id}`);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-[28px] font-bold">방송 정보 수정</h1>
      <BroadcastForm
        action={updateBroadcast.bind(null, id)}
        defaultValues={broadcast}
        submitLabel="저장"
      />
    </div>
  );
}
