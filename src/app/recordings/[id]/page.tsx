import Link from "next/link";
import { notFound } from "next/navigation";
import { OffAirScreen } from "@/features/broadcasts/off-air-screen";
import { countRecordingPlay, findRecording, formatDuration } from "@/features/recordings/queries";
import { ReplayPlayer } from "@/features/recordings/replay-player";

export default async function RecordingPage({ params }: PageProps<"/recordings/[id]">) {
  const { id } = await params;
  const recording = await findRecording(id);
  if (!recording) notFound();
  if (recording.status === "ready") await countRecordingPlay(recording.id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {recording.status === "ready" && <ReplayPlayer src={recording.url} />}
      {recording.status === "recording" && <OffAirScreen face="sleepy" message="녹화를 저장하는 중입니다" />}
      {recording.status === "failed" && <OffAirScreen face="dead" message="녹화 저장에 실패했습니다" />}

      <div className="space-y-1">
        <h1 className="text-xl font-bold">{recording.broadcast.title}</h1>
        <p className="text-sm text-muted-foreground">
          {recording.broadcast.owner.nickname} · {new Date(recording.started_at).toLocaleString("ko-KR")}
          {recording.ended_at && ` · ${formatDuration(recording.started_at, recording.ended_at)}`}
        </p>
        <Link href={`/broadcasts/${recording.broadcast_id}`} className="text-sm text-primary underline">
          방송 페이지로
        </Link>
      </div>
    </div>
  );
}
