import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mascot } from "@/features/mascot/mascot";

/** 결제 성공·실패 뒤 보여주는 화면 */
export function DonationResult({
  ok,
  title,
  message,
  broadcastId,
}: {
  ok: boolean;
  title: string;
  message: string;
  broadcastId: string | null;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <Mascot face={ok ? "happy" : "dead"} size={120} bounce={ok} />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href={broadcastId ? `/broadcasts/${broadcastId}` : "/"} className={buttonVariants()}>
        {broadcastId ? "방송으로 돌아가기" : "메인으로"}
      </Link>
    </div>
  );
}
