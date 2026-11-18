"use client";

import "@livekit/components-styles";
import { useEffect, useState } from "react";
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
import { getViewerConnection, type LiveConnection } from "./actions";
import { isPublisherIdentity } from "./identity";

/** 시청자용 플레이어. 서버에서 구독 전용 토큰을 받아 접속한다. */
export function LivePlayer({ broadcastId }: { broadcastId: string }) {
  const router = useRouter();
  const [connection, setConnection] = useState<LiveConnection>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getViewerConnection(broadcastId).then((result) => {
      if ("error" in result) setError(result.error);
      else setConnection(result);
    });
  }, [broadcastId]);

  if (error) return <OffAirScreen face="dead" message={error} />;
  if (!connection) return <OffAirScreen face="happy" message="연결 중..." />;

  return (
    <LiveKitRoom
      serverUrl={connection.serverUrl}
      token={connection.token}
      connect
      audio={false}
      video={false}
      // 방송이 종료되어 방이 삭제되면 연결이 끊긴다 → 서버에서 최신 상태(종료)를 다시 받아온다
      onDisconnected={() => router.refresh()}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <Stage />
      <RoomAudioRenderer />
      <StartAudio
        label="소리 켜기"
        className="absolute top-3 left-3 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
      />
    </LiveKitRoom>
  );
}

function Stage() {
  const [video] = useTracks([Track.Source.ScreenShare, Track.Source.Camera], { onlySubscribed: true });
  const viewers = useRemoteParticipants().filter((p) => !isPublisherIdentity(p.identity)).length + 1;

  return (
    <>
      {video ? (
        <VideoTrack trackRef={video} className="size-full object-contain" />
      ) : (
        <OffAirScreen face="sleepy" message="방송자의 화면을 기다리는 중..." />
      )}
      <span className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs">
        시청자 {viewers}명
      </span>
    </>
  );
}
