import { renderFrame, seededRandom, toSvg, type MascotFace } from "@/features/mascot/pixels";

const FACES: MascotFace[] = ["happy", "sleepy", "dead"];

export const dynamicParams = false;
export const generateStaticParams = () => FACES.map((face) => ({ face: `${face}.svg` }));

/**
 * 표정별 정지 마스코트 SVG (/mascot/happy.svg 등). 빌드 때 한 번 만들어진다.
 * 파비콘·헤더 로고, 그리고 캔버스가 그려지기 전(자바스크립트 실행 전)의 마스코트 배경으로 쓴다.
 */
export async function GET(_: Request, { params }: RouteContext<"/mascot/[face]">) {
  const face = (await params).face.replace(/\.svg$/, "") as MascotFace;
  return new Response(toSvg(renderFrame(face, seededRandom(7))), {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
  });
}
