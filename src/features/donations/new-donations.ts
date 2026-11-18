import type { DonationItem } from "./queries";

/**
 * 폴링으로 받은 후원 목록(최신순)에서 아직 본 적 없는 것만 오래된 순으로 고른다.
 * 처음 불러온 목록은 seen에 넣어 두므로, 페이지를 연 뒤에 들어온 후원만 알림 대상이 된다.
 */
export function pickNewDonations(seen: Set<string>, items: DonationItem[]): DonationItem[] {
  return items.filter((d) => !seen.has(d.id)).reverse();
}
