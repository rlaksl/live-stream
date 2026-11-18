import { won } from "./policy";
import type { DonationSummary } from "./queries";

/** 방송 상세의 확정 후원 합계와 내역(닉네임·금액). 메시지는 댓글창에 보여준다. */
export function DonationPanel({ summary }: { summary: DonationSummary }) {
  return (
    <section aria-labelledby="donations-title" className="flex flex-col gap-3 rounded-sm border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 id="donations-title" className="font-bold">
          후원
        </h2>
        <span className="text-sm text-muted-foreground">
          합계 <strong className="text-lg text-primary">{won(summary.total)}</strong>
        </span>
      </div>
      <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto">
        {summary.items.length === 0 && <li className="text-sm text-muted-foreground">아직 후원이 없습니다.</li>}
        {summary.items.map((d) => (
          <li key={d.id} className="flex justify-between gap-2 text-sm">
            <span>{d.donor.nickname}</span>
            <span className="text-primary">{won(d.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
