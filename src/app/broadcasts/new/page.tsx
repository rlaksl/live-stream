import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { createBroadcast } from "@/features/broadcasts/actions";
import { BroadcastForm } from "@/features/broadcasts/broadcast-form";

export default async function NewBroadcastPage() {
  if (!(await getCurrentUser())) redirect("/login?next=/broadcasts/new");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">방송 만들기</h1>
      <p className="text-sm text-muted-foreground">
        방송 정보를 등록하면 송출 화면으로 이동합니다. 그곳에서 화면 공유 또는 카메라를 골라 방송을 시작하세요.
      </p>
      <BroadcastForm action={createBroadcast} submitLabel="등록하고 송출 화면으로" />
    </div>
  );
}
