export type BroadcastStatus = "waiting" | "live" | "ended";

export const STATUS_LABEL: Record<BroadcastStatus, string> = {
  waiting: "대기",
  live: "방송 중",
  ended: "종료",
};

/** 방송 카테고리. DB check 제약(supabase/migrations/0004)과 같은 목록이다. */
export const CATEGORY_LABEL = {
  game: "게임",
  music: "음악",
  talk: "토크",
  study: "공부",
  dev: "개발",
  etc: "기타",
} as const;

export type Category = keyof typeof CATEGORY_LABEL;

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.includes(value as Category);
}

export type Broadcast = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: Category;
  status: BroadcastStatus;
  record_enabled: boolean;
  /** 방송 예정 시각(선택). 편성표에 쓴다. */
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  owner: { nickname: string };
};
