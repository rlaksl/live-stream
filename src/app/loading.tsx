import { Mascot } from "@/features/mascot/mascot";

export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-24">
      <Mascot face="happy" size={96} bounce />
      <p className="font-pixel text-xs tracking-widest text-muted-foreground">loading...</p>
    </div>
  );
}
