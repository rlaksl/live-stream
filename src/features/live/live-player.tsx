"use client";

import "@livekit/components-styles";
import { useEffect, useRef, useState } from "react";
import { Maximize } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { OffAirScreen } from "@/features/broadcasts/off-air-screen";
import { Mascot } from "@/features/mascot/mascot";
import { getViewerConnection, type LiveConnection } from "./actions";
import { isPublisherIdentity } from "./identity";

/** 시청자용 플레이어. 서버에서 구독 전용 토큰을 받아 접속한다. */
export function LivePlayer({ broadcastId }: { broadcastId: string }) {
  const router = useRouter();
  const [connection, setConnection] = useState<LiveConnection>();
  const [error, setError] = useState<string>();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getViewerConnection(broadcastId).then((result) => {
      if ("error" in result) setError(result.error);
      else setConnection(result);
    });
  }, [broadcastId]);

  if (error) return <OffAirScreen face="dead" message={error} />;
  if (!connection) return <OffAirScreen face="happy" message="연결 중..." />;

  return (
    <div ref={boxRef} className="relative aspect-video w-full overflow-hidden rounded-sm border bg-black">
      <LiveKitRoom
        serverUrl={connection.serverUrl}
        token={connection.token}
        connect
        audio={false}
        video={false}
        // 방송이 종료되어 방이 삭제되면 연결이 끊긴다 → 서버에서 최신 상태(종료)를 다시 받아온다
        onDisconnected={() => router.refresh()}
        className="size-full"
      >
        <Stage />
        <RoomAudioRenderer />
        <span className="absolute top-4 left-4 rounded-sm bg-primary px-2.5 py-1.5 font-pixel text-sm text-primary-foreground">
          LIVE
        </span>
        {/* 브라우저가 자동 재생 소리를 막았을 때만 보인다 */}
        <StartAudio
          label="소리 켜기"
          className="absolute bottom-4 left-4 rounded-sm bg-black/60 px-3 py-2.5 text-sm font-medium text-foreground"
        />
      </LiveKitRoom>
      <button
        type="button"
        aria-label="전체 화면"
        onClick={() => boxRef.current?.requestFullscreen()}
        className="absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-sm bg-black/60 hover:text-primary"
      >
        <Maximize className="size-5" />
      </button>
    </div>
  );
}

function Stage() {
  const [video] = useTracks([Track.Source.ScreenShare, Track.Source.Camera], {
    onlySubscribed: true,
  });
  const viewers = useRemoteParticipants().filter((p) => !isPublisherIdentity(p.identity)).length + 1;

  return (
    <>
      {video ? (
        <VideoTrack trackRef={video} className="size-full object-contain" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-3">
          <Mascot face="sleepy" size={100} />
          <p className="text-sm text-muted-foreground">방송자의 화면을 기다리는 중...</p>
        </div>
      )}
      <span className="absolute top-4 right-4 rounded-sm bg-black/60 px-2.5 py-1.5 text-[13px]">시청 {viewers}명</span>
    </>
  );
}
