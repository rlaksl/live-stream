"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { HEIGHT, WIDTH, renderFrame, type MascotFace } from "./pixels";

export type { MascotFace };

const FPS = 12;

/**
 * 브라운관 TV 마스코트. 화면 속 노이즈가 지직거리고, 얼굴은 항상 노이즈 앞에 또렷하게 보인다.
 * bounce: 통통 튀다 점점 작게 튀며 멈춘다 (랜딩·로딩). 움직임 줄이기 설정이면 튀지도, 지직거리지도 않는다.
 */
export function Mascot({
  face,
  size = 160,
  bounce = false,
  className,
}: {
  face: MascotFace;
  size?: number;
  bounce?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      renderFrame(face, Math.random, frame++).forEach((row, y) =>
        row.forEach((color, x) => {
          if (!color) return;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }),
      );
    };

    draw();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(draw, 1000 / FPS);
    return () => clearInterval(timer);
  }, [face]);

  return (
    <div className={cn(bounce && "motion-safe:animate-mascot-bounce", className)} aria-hidden>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: size,
          height: (size * HEIGHT) / WIDTH,
          imageRendering: "pixelated",
          // 자바스크립트 실행 전(첫 로딩)에도 보이도록 같은 그림의 정지 SVG를 깔아 둔다
          backgroundImage: `url(/mascot/${face}.svg)`,
          backgroundSize: "100% 100%",
        }}
      />
    </div>
  );
}
