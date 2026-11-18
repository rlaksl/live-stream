/** 마이페이지 후원 내역 한 줄 (받은 후원·한 후원 공통) */
export type DonationRecord = {
  id: string;
  amount: number;
  message: string;
  confirmed_at: string;
  /** 방송이 삭제되면 null */
  broadcast: { id: string; title: string } | null;
  /** 받은 후원이면 후원자, 한 후원이면 방송자 */
  other: { nickname: string };
};

export type BroadcastTotal = { broadcastId: string | null; title: string; total: number; count: number };

/** 방송별 합계(큰 금액 순). 삭제된 방송의 후원은 하나로 묶는다. */
export function totalsByBroadcast(records: DonationRecord[]): BroadcastTotal[] {
  const map = new Map<string | null, BroadcastTotal>();
  for (const r of records) {
    const key = r.broadcast?.id ?? null;
    const row = map.get(key) ?? { broadcastId: key, title: r.broadcast?.title ?? "삭제된 방송", total: 0, count: 0 };
    row.total += r.amount;
    row.count += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
