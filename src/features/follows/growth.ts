/** 팔로워 날짜별 누적 수 한 칸 */
export type GrowthPoint = { date: string; label: string; total: number; added: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_MS = 9 * 60 * 60 * 1000;

/** KST 날짜 문자열(YYYY-MM-DD) */
const kstDay = (ms: number) => new Date(ms + KST_MS).toISOString().slice(0, 10);

/**
 * 팔로우 시작 시각들로 최근 days일(KST, 오늘 포함)의 날짜별 누적 팔로워 수를 만든다.
 * 기간 이전에 팔로우한 사람은 첫날 누적에 포함된다. (언팔로우한 기록은 남지 않으므로 지금 팔로워 기준)
 */
export function followerGrowth(since: string[], days: number, now: Date): GrowthPoint[] {
  const nowMs = now.getTime();
  const dayKeys = Array.from({ length: days }, (_, i) => kstDay(nowMs - (days - 1 - i) * DAY_MS));
  const followDays = since.map((iso) => kstDay(new Date(iso).getTime()));

  return dayKeys.map((date) => {
    const total = followDays.filter((d) => d <= date).length;
    const added = followDays.filter((d) => d === date).length;
    const [, m, d] = date.split("-");
    return { date, label: `${Number(m)}/${Number(d)}`, total, added };
  });
}
