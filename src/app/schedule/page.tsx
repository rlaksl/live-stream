import { BroadcastCard } from "@/features/broadcasts/broadcast-card";
import { listScheduled } from "@/features/broadcasts/queries";
import { formatKst, kstDate } from "@/features/broadcasts/schedule";
import type { Broadcast } from "@/features/broadcasts/types";

/** 편성표: 오늘 이후로 예정된 방송을 날짜별로 (한국 시간) */
export default async function SchedulePage() {
  const broadcasts = await listScheduled();
  // 날짜(KST)별로 묶는다. 목록이 예정 시각순이라 날짜도 순서대로 쌓인다.
  const days = new Map<string, Broadcast[]>();
  for (const b of broadcasts) {
    const day = kstDate(b.scheduled_at!);
    days.set(day, [...(days.get(day) ?? []), b]);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">편성표</h1>
        <p className="text-sm text-muted-foreground">
          예정 시각을 정한 방송이 시간순으로 보입니다(한국 시간). 방송 등록·수정 때 예정 시각을 넣을 수 있습니다.
        </p>
      </div>
      {broadcasts.length === 0 && <p className="py-10 text-center text-muted-foreground">예정된 방송이 없습니다.</p>}
      {[...days].map(([day, items]) => (
        <section key={day} className="space-y-3">
          <h2 className="border-b pb-2 text-lg font-bold">{formatKst(items[0].scheduled_at!).split(" ")[0]}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <BroadcastCard key={b.id} broadcast={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
