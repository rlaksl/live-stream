"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  TrackEvent,
  createLocalAudioTrack,
  createLocalScreenTracks,
  createLocalVideoTrack,
  type LocalTrack,
} from "livekit-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatKst } from "@/features/broadcasts/schedule";
import { CATEGORY_LABEL, type Broadcast, type BroadcastStatus } from "@/features/broadcasts/types";
import { cn } from "@/lib/utils";
import { DonationAlert } from "@/features/donations/donation-alert";
import { startBroadcastRecording, stopBroadcastRecording } from "@/features/recordings/actions";
import { cancelStart, endBroadcast, getPublishConnection, startBroadcast } from "./actions";

type Source = "screen" | "camera";

/** 녹화 최대 길이. LiveKit 무료 녹화 한도(월 60분)를 아끼기 위해 10분으로 제한한다. (docs/adr/0002) */
const MAX_RECORDING_MS = 10 * 60 * 1000;
type Phase = "setup" | "preview" | "live" | "ended";

/**
 * 방송자의 송출 화면.
 * 1) 소스를 골라 미리보기(브라우저 권한 요청은 클릭 직후에 해야 하므로 방송 시작 전에 미디어를 먼저 얻는다)
 * 2) 방송 시작: 서버가 상태를 `방송 중`으로 바꾸고 송출 토큰을 준다 → LiveKit에 트랙을 송출
 *    송출에 실패하면 상태를 `대기`로 되돌리고 장치를 정리해 처음부터 다시 시도할 수 있게 한다
 * 3) 방송 종료: 서버가 상태를 `종료`로 바꾸고 LiveKit 방을 닫는다
 */
export function Studio({
  broadcastId,
  initialStatus,
  info,
}: {
  broadcastId: string;
  initialStatus: BroadcastStatus;
  /** 오른쪽 "방송 정보" 패널에 읽기 전용으로 보여준다 (수정은 수정 화면에서) */
  info: Pick<Broadcast, "title" | "category" | "scheduled_at">;
}) {
  const router = useRouter();
  const canShareScreen = useCanShareScreen();
  // 직접 고르기 전에는 화면 공유가 가능하면 화면 공유, 아니면 카메라
  const [chosenSource, setSource] = useState<Source | null>(null);
  const source = chosenSource ?? (canShareScreen ? "screen" : "camera");
  const [phase, setPhase] = useState<Phase>(initialStatus === "ended" ? "ended" : "setup");
  // 서버의 방송 상태. 이 화면에서 시작하거나 시작을 되돌리면 바뀐다.
  const [status, setStatus] = useState(initialStatus);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [recordEnabled, setRecordEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  tracksRef.current = tracks;
  const previewRef = useRef<HTMLVideoElement>(null);

  const videoTrack = tracks.find((t): t is LocalVideoTrack => t.kind === Track.Kind.Video);
  const hasTabAudio = tracks.some((t) => t.source === Track.Source.ScreenShareAudio);
  const hasMic = tracks.some((t) => t.source === Track.Source.Microphone);

  useEffect(() => {
    if (videoTrack && previewRef.current) videoTrack.attach(previewRef.current);
    return () => {
      videoTrack?.detach();
    };
  }, [videoTrack]);

  // 화면을 떠나면 장치와 연결을 정리한다 (방송 상태는 LiveKit 웹훅이 종료로 바꾼다)
  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      tracksRef.current.forEach((t) => t.stop());
      clearTimeout(recordTimerRef.current);
    };
  }, []);

  async function preview() {
    setBusy(true);
    try {
      const media =
        source === "screen"
          ? [
              // 탭·시스템 소리는 화면 공유 창의 "오디오 공유"를 켜야 들어온다 (Chrome·Edge)
              ...(await createLocalScreenTracks({
                audio: true,
                systemAudio: "include",
                selfBrowserSurface: "exclude",
              })),
              await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true }),
            ]
          : [
              await createLocalVideoTrack({ facingMode: "user", resolution: { width: 1280, height: 720 } }),
              await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true }),
            ];
      setTracks(media);
      setPhase("preview");
    } catch (error) {
      toast.error(`장치를 사용할 수 없습니다: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function goLive() {
    setBusy(true);
    // 이 화면에서 대기 → 방송 중으로 바꿨을 때만 실패 시 되돌린다 (다른 탭이 송출 중인 방송은 건드리지 않는다)
    let startedHere = false;
    let room: Room | undefined;
    try {
      // 이미 방송 중인 방송(송출 중 새로고침 등)은 상태를 바꾸지 않고 다시 연결만 한다
      if (status === "waiting") {
        const started = await startBroadcast(broadcastId, recordEnabled);
        if ("error" in started) throw new Error(started.error);
        startedHere = true;
        setStatus("live");
      }
      const connection = await getPublishConnection(broadcastId);
      if ("error" in connection) throw new Error(connection.error);

      room = new Room();
      await room.connect(connection.serverUrl, connection.token);
      for (const track of tracks) await room.localParticipant.publishTrack(track);
      room.on(RoomEvent.Disconnected, () => setPhase("ended"));
      roomRef.current = room;

      // 브라우저의 "공유 중지"를 누르면 방송도 종료한다
      videoTrack?.on(TrackEvent.Ended, () => void stop());
      setPhase("live");
      router.refresh();

      if (recordEnabled) await startRecordingFor10Minutes();
    } catch (error) {
      // 상태를 먼저 되돌린 뒤 연결을 끊는다. 순서가 바뀌면 웹훅(방송자 이탈)이 방송을 종료시킨다.
      if (startedHere) {
        await cancelStart(broadcastId);
        setStatus("waiting");
      }
      await room?.disconnect();
      tracks.forEach((t) => t.stop());
      setTracks([]);
      setPhase("setup");
      router.refresh();
      toast.error(`송출을 시작하지 못했습니다. 다시 시도하세요. (${(error as Error).message})`);
    } finally {
      setBusy(false);
    }
  }

  async function startRecordingFor10Minutes() {
    const result = await startBroadcastRecording(broadcastId);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setRecording(true);
    recordTimerRef.current = setTimeout(async () => {
      await stopBroadcastRecording(broadcastId);
      setRecording(false);
      toast.info("녹화 최대 길이(10분)에 도달해 녹화를 멈췄습니다. 방송은 계속됩니다.");
    }, MAX_RECORDING_MS);
  }

  async function stop() {
    setBusy(true);
    clearTimeout(recordTimerRef.current);
    const result = await endBroadcast(broadcastId);
    if ("error" in result) toast.error(result.error);
    await roomRef.current?.disconnect();
    tracks.forEach((t) => t.stop());
    setTracks([]);
    setRecording(false);
    setPhase("ended");
    setBusy(false);
    router.refresh();
  }

  async function flipCamera() {
    if (!(videoTrack instanceof LocalVideoTrack)) return;
    const facing = videoTrack.mediaStreamTrack.getSettings().facingMode === "user" ? "environment" : "user";
    await videoTrack.restartTrack({ facingMode: facing });
  }

  function toggleMic() {
    const mic = tracks.find((t): t is LocalAudioTrack => t.source === Track.Source.Microphone);
    if (!mic) return;
    if (micMuted) mic.unmute();
    else mic.mute();
    setMicMuted(!micMuted);
  }

  /** 미리보기를 버리고 소스 선택으로 돌아간다 (공유 소리를 다시 고를 때) */
  function resetPreview() {
    tracks.forEach((t) => t.stop());
    setTracks([]);
    setPhase("setup");
  }

  if (phase === "ended") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-sm border bg-card p-8 text-center">
        <p>방송이 종료되었습니다.</p>
        <Button onClick={() => router.push(`/broadcasts/${broadcastId}`)}>방송 페이지로</Button>
      </div>
    );
  }

  const live = phase === "live";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
      <section aria-label="송출 미리보기" className="flex min-w-0 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SourceCard
            active={source === "screen"}
            disabled={!canShareScreen || phase !== "setup"}
            onClick={() => setSource("screen")}
            title="화면 공유"
            description={canShareScreen ? "PC · 화면과 탭/시스템 소리" : "PC 브라우저에서만"}
          />
          <SourceCard
            active={source === "camera"}
            disabled={phase !== "setup"}
            onClick={() => setSource("camera")}
            title="카메라"
            description="휴대폰 · 전면/후면 전환"
          />
        </div>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm border bg-[#18181c]">
          {videoTrack ? (
            <video ref={previewRef} muted playsInline className="size-full object-contain" />
          ) : (
            <span className="text-[15px] text-[#8a8a93]">소스를 고르고 미리보기를 시작하세요</span>
          )}
          <div className="absolute top-4 left-4 flex gap-2 text-[13px]">
            {live ? (
              <>
                <span className="rounded-sm bg-primary px-2.5 py-1.5 font-pixel text-sm text-primary-foreground">
                  LIVE
                </span>
                {recording && <span className="rounded-sm bg-black/70 px-2.5 py-1.5">● REC (최대 10분)</span>}
              </>
            ) : (
              <span className="rounded-sm bg-[#2a2a30] px-2.5 py-1.5 text-[#d4d4d8]">미리보기 · 아직 송출 전</span>
            )}
          </div>
          <DonationAlert broadcastId={broadcastId} />
        </div>

        {phase === "setup" ? (
          <p className="text-sm text-muted-foreground">
            {canShareScreen
              ? "화면 공유 시 공유 창에서 '탭 오디오 공유'(또는 '시스템 오디오 공유')를 켜면 탭 소리가 마이크와 함께 송출됩니다. 소리 송출은 Chrome·Edge 데스크톱에서 지원됩니다."
              : "모바일에서는 카메라와 마이크로 방송합니다."}
          </p>
        ) : (
          <>
            <div role="list" aria-label="장치 상태" className="flex flex-wrap gap-3">
              <DeviceStatus
                label={source === "screen" ? "화면" : "카메라"}
                ok={!!videoTrack}
                text={videoTrack ? "연결됨" : "없음"}
              />
              <DeviceStatus
                label="마이크"
                ok={hasMic && !micMuted}
                text={!hasMic ? "없음" : micMuted ? "꺼짐" : "연결됨"}
              />
              {source === "screen" && (
                <DeviceStatus label="공유 소리" ok={hasTabAudio} text={hasTabAudio ? "연결됨" : "감지 안 됨"} />
              )}
            </div>
            {source === "screen" && !hasTabAudio && phase === "preview" && (
              <p className="text-sm leading-[1.9]">
                <span className="highlight">공유 창에서 &apos;탭 오디오 공유&apos;를 켜 주세요</span>{" "}
                <button type="button" onClick={resetPreview} className="text-primary underline">
                  다시 고르기
                </button>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={toggleMic}>
                {micMuted ? "마이크 켜기" : "마이크 끄기"}
              </Button>
              {source === "camera" && (
                <Button variant="outline" onClick={flipCamera}>
                  카메라 전환
                </Button>
              )}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="info-title" className="flex flex-col gap-[18px] rounded-sm border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 id="info-title" className="text-lg font-bold">
            방송 정보
          </h2>
          {!live && (
            <Link href={`/broadcasts/${broadcastId}/edit`} className="text-sm text-primary">
              수정
            </Link>
          )}
        </div>
        <ReadOnlyField label="제목" value={info.title} />
        <ReadOnlyField label="카테고리" value={CATEGORY_LABEL[info.category]} />
        <ReadOnlyField label="예정 시간" value={info.scheduled_at ? formatKst(info.scheduled_at) : "없음"} />

        {status === "waiting" && (
          <div className="flex items-center justify-between gap-3 rounded-sm bg-background p-3.5">
            <Label htmlFor="record" className="flex flex-col items-start gap-0.5">
              <span className="text-[15px] font-medium">녹화하기</span>
              <span className="text-xs font-normal text-muted-foreground">최대 10분 · 끝나면 다시보기에 올라가요</span>
            </Label>
            <Switch id="record" checked={recordEnabled} onCheckedChange={setRecordEnabled} />
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {phase === "setup" && (
            <Button disabled={busy} onClick={preview} className={bigButton}>
              미리보기 시작
            </Button>
          )}
          {phase === "preview" && (
            <Button disabled={busy} onClick={goLive} className={bigButton}>
              {status === "live" ? "송출 다시 연결" : "방송 시작"}
            </Button>
          )}
          {live && (
            <Button variant="destructive" disabled={busy} onClick={stop} className={bigButton}>
              방송 종료
            </Button>
          )}
          <p className="text-center text-xs text-[#8a8a93]">
            {live ? "시청자에게 송출 중입니다." : "연결과 송출이 확인된 뒤에 LIVE로 바뀝니다."}
          </p>
        </div>
      </section>
    </div>
  );
}

const bigButton = "h-auto py-4 text-[17px] font-bold";

/** 화면 공유는 데스크톱 브라우저에서만 제공한다 (모바일은 카메라) */
function useCanShareScreen() {
  return useSyncExternalStore(
    () => () => {},
    () =>
      !window.matchMedia("(pointer: coarse)").matches && typeof navigator.mediaDevices?.getDisplayMedia === "function",
    () => false,
  );
}

function SourceCard({
  active,
  title,
  description,
  ...props
}: { active: boolean; title: string; description: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-1 rounded-sm border bg-card p-4 text-left disabled:cursor-default disabled:opacity-60",
        active ? "border-2 border-primary" : "border-input",
      )}
      {...props}
    >
      <span className="font-bold">{title}</span>
      <span className="text-[13px] text-muted-foreground">{description}</span>
    </button>
  );
}

/** 장치 상태 칸: 정상은 흰 체크박스, 문제는 주황 빈 네모 + 주황 테두리 */
function DeviceStatus({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <div
      role="listitem"
      className={cn("flex flex-[1_1_140px] flex-col gap-1 rounded-sm border bg-card p-3.5", !ok && "border-primary")}
    >
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn("flex items-center gap-2 text-[15px]", !ok && "text-primary")}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          {ok ? (
            <>
              <rect
                x="0.75"
                y="0.75"
                width="14.5"
                height="14.5"
                rx="2"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M4.5 8.2l2.3 2.3 4.7-5" fill="none" stroke="#111" strokeWidth="2" />
            </>
          ) : (
            <rect
              x="0.75"
              y="0.75"
              width="14.5"
              height="14.5"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          )}
        </svg>
        {text}
      </span>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-[#d4d4d8]">{label}</span>
      <span className="rounded-sm border border-input bg-background px-3.5 py-3 text-[15px]">{value}</span>
    </div>
  );
}
