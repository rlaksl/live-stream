"use client";

import { useEffect, useRef } from "react";
import Hls, { type HlsConfig } from "hls.js";

/**
 * 녹화(HLS)를 video에 연결하고 정리 함수를 돌려준다.
 * Safari와 최신 Chrome은 HLS를 직접 재생하므로 그대로 쓰고, 그 밖의 브라우저는 hls.js를 쓴다.
 */
export function loadHls(video: HTMLVideoElement, src: string, config: Partial<HlsConfig> = {}) {
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = config.startPosition ? `${src}#t=${config.startPosition}` : src;
    return () => {};
  }
  const hls = new Hls(config);
  hls.loadSource(src);
  hls.attachMedia(video);
  return () => hls.destroy();
}

/** 녹화 재생. 목록에서 눌러 들어오면 바로 재생한다(브라우저가 막으면 재생 버튼을 누르면 된다). */
export function ReplayPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => loadHls(videoRef.current!, src), [src]);

  return <video ref={videoRef} controls autoPlay playsInline className="aspect-video w-full rounded-xl bg-black" />;
}
