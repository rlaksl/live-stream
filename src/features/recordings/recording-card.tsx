import Link from "next/link";
import { CATEGORY_LABEL } from "@/features/broadcasts/types";
import { formatDuration, type Recording } from "./queries";
import { RecordingThumbnail } from "./recording-thumbnail";

export function RecordingCard({ recording }: { recording: Recording & { url: string } }) {
  const { broadcast } = recording;

  return (
    <Link href={`/recordings/${recording.id}`} className="group flex flex-col gap-3">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-sm border bg-[#18181c] transition group-hover:border-primary">
        <RecordingThumbnail src={recording.url} />
        <span className="absolute right-2.5 bottom-2.5 rounded-sm bg-black/60 px-2 py-1 text-xs">
          {formatDuration(recording.started_at, recording.ended_at)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="truncate font-medium group-hover:text-primary">{broadcast.title}</span>
        <span className="text-sm text-muted-foreground">
          {broadcast.owner.nickname} · {CATEGORY_LABEL[broadcast.category]} ·{" "}
          {new Date(recording.started_at).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </Link>
  );
}
