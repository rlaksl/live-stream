import Link from "next/link";
import { Mascot } from "@/features/mascot/mascot";
import { StatusBadge } from "./status-badge";
import { formatKst } from "./schedule";
import { CATEGORY_LABEL, type Broadcast } from "./types";

export function BroadcastCard({ broadcast, viewers }: { broadcast: Broadcast; viewers?: number }) {
  const face = broadcast.status === "live" ? "happy" : broadcast.status === "waiting" ? "sleepy" : "dead";

  return (
    <Link href={`/broadcasts/${broadcast.id}`} className="group flex flex-col gap-3">
      <div className="relative flex aspect-video items-center justify-center rounded-sm border bg-[#18181c] transition group-hover:border-primary">
        <Mascot face={face} size={80} />
        <StatusBadge status={broadcast.status} className="absolute top-2.5 left-2.5" />
        {viewers !== undefined && (
          <span className="absolute right-2.5 bottom-2.5 rounded-sm bg-black/60 px-2 py-1 text-xs">시청 {viewers}</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="truncate font-medium group-hover:text-primary">{broadcast.title}</span>
        <span className="text-sm text-muted-foreground">
          {broadcast.owner.nickname} · {CATEGORY_LABEL[broadcast.category]}
          {broadcast.status === "waiting" && broadcast.scheduled_at && ` · 예정 ${formatKst(broadcast.scheduled_at)}`}
        </span>
      </div>
    </Link>
  );
}
