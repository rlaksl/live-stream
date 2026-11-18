"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

/** 녹화(HLS) 재생. Safari는 HLS를 기본 지원하므로 그대로 쓰고, 그 밖의 브라우저는 hls.js를 쓴다. */
export function ReplayPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src]);

  return <video ref={videoRef} controls playsInline className="aspect-video w-full rounded-xl bg-black" />;
}
