"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
import type { BroadcastStatus } from "@/features/broadcasts/types";
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
export function Studio({ broadcastId, initialStatus }: { broadcastId: string; initialStatus: BroadcastStatus }) {
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
              ...(await createLocalScreenTracks({ audio: true, systemAudio: "include", selfBrowserSurface: "exclude" })),
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

  if (phase === "ended") {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <p>방송이 종료되었습니다.</p>
        <Button onClick={() => router.push(`/broadcasts/${broadcastId}`)}>방송 페이지로</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {videoTrack ? (
          <video ref={previewRef} muted playsInline className="size-full object-contain" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            소스를 고르고 미리보기를 시작하세요
          </div>
        )}
        {phase === "live" && (
          <div className="absolute top-3 left-3 flex gap-2 text-xs font-bold text-white">
            <span className="rounded-sm bg-primary px-2 py-1 font-pixel text-primary-foreground">LIVE</span>
            {recording && <span className="rounded-md bg-black/70 px-2 py-1">● REC (최대 10분)</span>}
          </div>
        )}
      </div>

      {phase === "setup" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <SourceButton active={source === "screen"} disabled={!canShareScreen} onClick={() => setSource("screen")}>
              🖥️ 화면 공유
            </SourceButton>
            <SourceButton active={source === "camera"} onClick={() => setSource("camera")}>
              📷 카메라
            </SourceButton>
          </div>
          <p className="text-xs text-muted-foreground">
            {canShareScreen
              ? "화면 공유 시 공유 창에서 '탭 오디오 공유'(또는 '시스템 오디오 공유')를 켜면 탭 소리가 마이크와 함께 송출됩니다. 소리 송출은 Chrome·Edge 데스크톱에서 지원됩니다."
              : "모바일에서는 카메라와 마이크로 방송합니다."}
          </p>
          <Button size="lg" className="w-full" disabled={busy} onClick={preview}>
            미리보기 시작
          </Button>
        </div>
      )}

      {phase !== "setup" && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Indicator ok={!!videoTrack} label={source === "screen" ? "화면" : "카메라"} />
          {source === "screen" && <Indicator ok={hasTabAudio} label="탭·시스템 소리" />}
          <Indicator ok={hasMic && !micMuted} label={micMuted ? "마이크 꺼짐" : "마이크"} />
        </div>
      )}

      {phase === "preview" && (
        <div className="space-y-4">
          {source === "screen" && !hasTabAudio && (
            <p className="text-sm text-amber-400">
              탭 소리가 공유되지 않았습니다. 탭 소리도 보내려면 다시 미리보기를 시작해 &apos;오디오 공유&apos;를 켜세요.
            </p>
          )}
          {status === "waiting" && (
            <div className="flex items-center gap-3">
              <Switch id="record" checked={recordEnabled} onCheckedChange={setRecordEnabled} />
              <Label htmlFor="record">녹화하기 (최대 10분, 다시보기에 저장)</Label>
            </div>
          )}
          <Button size="lg" className="w-full" disabled={busy} onClick={goLive}>
            {status === "live" ? "송출 다시 연결" : "방송 시작"}
          </Button>
        </div>
      )}

      {phase !== "setup" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={toggleMic}>
            {micMuted ? "마이크 켜기" : "마이크 끄기"}
          </Button>
          {source === "camera" && (
            <Button variant="outline" onClick={flipCamera}>
              카메라 전환
            </Button>
          )}
          {phase === "live" && (
            <Button variant="destructive" disabled={busy} onClick={stop}>
              방송 종료
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** 화면 공유는 데스크톱 브라우저에서만 제공한다 (모바일은 카메라) */
function useCanShareScreen() {
  return useSyncExternalStore(
    () => () => {},
    () =>
      !window.matchMedia("(pointer: coarse)").matches &&
      typeof navigator.mediaDevices?.getDisplayMedia === "function",
    () => false,
  );
}

function SourceButton({ active, ...props }: { active: boolean } & React.ComponentProps<typeof Button>) {
  return <Button variant={active ? "default" : "outline"} size="lg" {...props} />;
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "text-foreground" : "text-muted-foreground line-through"}>
      {ok ? "✅" : "⛔"} {label}
    </span>
  );
}
