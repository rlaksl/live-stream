import { Mascot, type MascotFace } from "@/features/mascot/mascot";

/** 송출 영상이 없을 때 플레이어 자리에 보여주는 화면 (대기·종료·연결 끊김) */
export function OffAirScreen({ face, message }: { face: MascotFace; message: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl bg-black/60">
      <Mascot face={face} size={120} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
