export type BroadcastStatus = "waiting" | "live" | "ended";

export const STATUS_LABEL: Record<BroadcastStatus, string> = {
  waiting: "대기",
  live: "방송 중",
  ended: "종료",
};

export type Broadcast = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: BroadcastStatus;
  record_enabled: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  owner: { nickname: string };
};
