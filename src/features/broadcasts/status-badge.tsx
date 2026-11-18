import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type BroadcastStatus } from "./types";

/** 방송 상태 배지. 방송 중은 주황 바탕에 픽셀 글꼴 LIVE. */
export function StatusBadge({ status, className }: { status: BroadcastStatus; className?: string }) {
  if (status === "live") {
    return (
      <Badge className={cn("bg-primary font-pixel text-primary-foreground", className)}>LIVE</Badge>
    );
  }
  return (
    <Badge variant={status === "ended" ? "outline" : "secondary"} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
