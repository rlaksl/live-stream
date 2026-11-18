"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/features/mascot/mascot";
import { RecordingThumbnail } from "@/features/recordings/recording-thumbnail";

export type Slide = {
  kind: "live" | "replay";
  href: string;
  title: string;
  /** 닉네임 · 카테고리 */
  meta: string;
  /** 오른쪽 위: 방송 중은 시청자 수, 다시보기는 재생 시간 */
  corner: string;
  /** 다시보기 녹화 주소(썸네일용) */
  videoUrl?: string;
};

/**
 * 홈 대표 영상. 방송 중을 먼저, 그 뒤 다시보기를 좌우 화살표와 점으로 넘긴다.
 * 방송 중 화면은 방문자마다 LiveKit에 연결하지 않도록 마스코트로 대신한다.
 */
export function FeaturedCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex((i + slides.length) % slides.length);

  if (slides.length === 0) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-sm border bg-[#18181c]">
        <Mascot face="surprised" size={140} />
        <p className="text-sm text-muted-foreground">아직 방송이 없어요. 첫 방송을 시작해 보세요.</p>
      </div>
    );
  }

  const slide = slides[index];
  const live = slide.kind === "live";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="relative">
        <Link href={slide.href} className="group block">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-sm border bg-[#18181c] transition group-hover:border-primary">
            {slide.videoUrl ? (
              <RecordingThumbnail key={slide.href} src={slide.videoUrl} mascotSize={100} />
            ) : (
              <Mascot face="happy" size={100} />
            )}
            <span
              className={cn(
                "absolute top-4 left-4 rounded-sm px-2.5 py-1.5 font-pixel text-sm text-[#111]",
                live ? "bg-primary" : "bg-foreground",
              )}
            >
              {live ? "LIVE" : "REPLAY"}
            </span>
            {slide.corner && (
              <span className="absolute top-4 right-4 rounded-sm bg-black/60 px-2.5 py-1.5 text-[13px]">
                {slide.corner}
              </span>
            )}
            <span className="absolute bottom-4 left-4 rounded-sm bg-foreground px-4 py-2.5 text-[15px] font-bold text-[#111]">
              {live ? "LIVE · 시청하기" : "다시보기 재생"}
            </span>
          </div>
        </Link>
        {slides.length > 1 && (
          <>
            <ArrowButton side="left" label="이전 방송" onClick={() => go(index - 1)} />
            <ArrowButton side="right" label="다음 방송" onClick={() => go(index + 1)} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate text-[22px] font-bold">{slide.title}</h2>
          <p className="text-[15px] text-muted-foreground">{slide.meta}</p>
        </div>
        {slides.length > 1 && (
          <div role="group" aria-label="방송 넘기기" className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.href}
                type="button"
                aria-label={`${i + 1}번째 방송: ${s.title}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-2 bg-input")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-input bg-background/80 hover:border-primary",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-[22px]" />
    </button>
  );
}
