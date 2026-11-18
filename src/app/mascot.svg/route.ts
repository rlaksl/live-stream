import { renderFrame, seededRandom, toSvg } from "@/features/mascot/pixels";

export const dynamic = "force-static";

/** 정지된 마스코트 SVG. 파비콘과 헤더 로고에 쓴다. 빌드 때 한 번 만들어진다. */
export function GET() {
  const svg = toSvg(renderFrame("happy", seededRandom(7)));
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
