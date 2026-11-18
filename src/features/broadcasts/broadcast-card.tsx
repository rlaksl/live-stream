import Link from "next/link";
import { Mascot } from "@/features/mascot/mascot";
import { StatusBadge } from "./status-badge";
import { CATEGORY_LABEL, type Broadcast } from "./types";

export function BroadcastCard({ broadcast, viewers }: { broadcast: Broadcast; viewers?: number }) {
  const face = broadcast.status === "live" ? "happy" : broadcast.status === "waiting" ? "sleepy" : "dead";

  return (
    <Link
      href={`/broadcasts/${broadcast.id}`}
      className="group block overflow-hidden rounded-xl border bg-card transition hover:border-primary/60"
    >
      <div className="relative flex aspect-video items-center justify-center bg-black/50">
        <Mascot face={face} size={80} />
        <StatusBadge status={broadcast.status} className="absolute top-2 left-2" />
        {viewers !== undefined && (
          <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs">
            시청자 {viewers}명
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate font-medium group-hover:text-primary">{broadcast.title}</p>
        <p className="text-xs text-muted-foreground">
          {broadcast.owner.nickname} · {CATEGORY_LABEL[broadcast.category]}
        </p>
      </div>
    </Link>
  );
}
