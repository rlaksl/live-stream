"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/features/mascot/mascot";
import { loadHls } from "./replay-player";

/** 썸네일로 쓰는 녹화 시작 지점(초). 0초는 첫 화면이 아직 검을 수 있다. */
const FRAME_AT = 1;

/**
 * 녹화의 실제 한 프레임을 썸네일로 보여준다. 별도 이미지 파일 없이 녹화 앞부분만 불러온다.
 * 프레임이 그려지기 전(또는 재생 전에는 프레임을 그리지 않는 iOS)에는 마스코트를 보여준다.
 */
export function RecordingThumbnail({ src, mascotSize = 80 }: { src: string; mascotSize?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => loadHls(videoRef.current!, src, { startPosition: FRAME_AT, maxBufferLength: 2 }), [src]);

  return (
    <>
      {!loaded && <Mascot face="happy" size={mascotSize} />}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setLoaded(true)}
        className={cn("absolute inset-0 size-full object-cover", !loaded && "invisible")}
      />
    </>
  );
}
