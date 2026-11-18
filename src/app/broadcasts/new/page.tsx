import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/current-user";
import { createBroadcast } from "@/features/broadcasts/actions";
import { BroadcastForm } from "@/features/broadcasts/broadcast-form";

export default async function NewBroadcastPage() {
  if (!(await getCurrentUser())) redirect("/login?next=/broadcasts/new");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold">방송하기</h1>
        <p className="text-[15px] text-muted-foreground">
          <span className="text-primary">1. 방송 정보</span> → 2. 송출 화면. 등록하면 송출 화면으로 넘어가고, 그곳에서
          &apos;방송 시작&apos;을 눌러야 LIVE가 됩니다.
        </p>
      </div>
      <BroadcastForm action={createBroadcast} submitLabel="등록하고 송출 화면으로" />
    </div>
  );
}
