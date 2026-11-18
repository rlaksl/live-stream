export type MascotFace = "happy" | "sleepy" | "dead";

/** 임시 자리표시. 티켓 06에서 픽셀 노이즈 캔버스 마스코트로 바꾼다. */
export function Mascot({ face, size = 160 }: { face: MascotFace; size?: number; bounce?: boolean }) {
  const eyes = { happy: "^ ^", sleepy: "- -", dead: "x x" }[face];
  return (
    <div
      className="flex items-center justify-center rounded-2xl border-4 border-primary/60 bg-muted font-pixel text-primary"
      style={{ width: size, height: size * 0.8, fontSize: size / 6 }}
      aria-hidden
    >
      {eyes}
    </div>
  );
}
