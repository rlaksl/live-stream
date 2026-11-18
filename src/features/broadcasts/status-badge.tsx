import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type BroadcastStatus } from "./types";

export function StatusBadge({ status, className }: { status: BroadcastStatus; className?: string }) {
  return (
    <Badge
      variant={status === "ended" ? "outline" : "secondary"}
      className={cn(status === "live" && "bg-live text-white", className)}
    >
      {status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
      {STATUS_LABEL[status]}
    </Badge>
  );
}
