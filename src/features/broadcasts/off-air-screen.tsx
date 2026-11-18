import { Mascot, type MascotFace } from "@/features/mascot/mascot";

/**
 * 송출 영상이 없을 때 플레이어 자리에 보여주는 화면 (대기·종료·연결 끊김).
 * label(픽셀 글꼴 작은 글씨)·title·children(버튼)은 대기·종료 화면에서만 쓴다.
 */
export function OffAirScreen({
  face,
  message,
  label,
  title,
  children,
}: {
  face: MascotFace;
  message: React.ReactNode;
  label?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-72 w-full flex-col items-center justify-center gap-4 rounded-sm border bg-card px-6 py-8 text-center sm:aspect-video">
      {label && <span className="font-pixel text-xs tracking-[2px] text-muted-foreground">{label}</span>}
      <Mascot face={face} size={title ? 140 : 120} />
      {title && <h2 className="text-[22px] font-bold">{title}</h2>}
      <p className="text-[15px] leading-relaxed text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
