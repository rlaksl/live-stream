import Link from "next/link";
import { formatDuration, type Recording } from "./queries";
import { RecordingThumbnail } from "./recording-thumbnail";

export function RecordingCard({ recording }: { recording: Recording & { url: string } }) {
  return (
    <Link
      href={`/recordings/${recording.id}`}
      className="group block overflow-hidden rounded-xl border bg-card transition hover:border-primary/60"
    >
      <div className="relative flex aspect-video items-center justify-center bg-black/50">
        <RecordingThumbnail src={recording.url} />
        <span className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold">▶ 다시보기</span>
        <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-xs">
          {formatDuration(recording.started_at, recording.ended_at)}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate font-medium group-hover:text-primary">{recording.broadcast.title}</p>
        <p className="text-xs text-muted-foreground">
          {recording.broadcast.owner.nickname} · {new Date(recording.started_at).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </Link>
  );
}
