import type { GrowthPoint } from "./growth";

/**
 * 팔로워 날짜별 누적 막대 그래프(한 계열이라 범례 없이 제목이 이름).
 * 막대에 마우스를 올리면(또는 탭하면) 그날 값을 보여주고, 아래 표로도 같은 값을 볼 수 있다.
 */
export function GrowthChart({ points }: { points: GrowthPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  const last = points[points.length - 1];

  return (
    <figure className="flex flex-col gap-3 rounded-sm border bg-card p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-bold">팔로워 수 (최근 {points.length}일)</span>
        <span className="text-sm text-muted-foreground">
          오늘 <strong className="text-lg text-foreground">{last.total}명</strong>
        </span>
      </figcaption>
      <div className="relative flex h-40 items-end gap-0.5 border-b border-border">
        {points.map((p) => (
          <div key={p.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            <div
              className="w-full rounded-t-[4px] bg-primary/80 group-hover:bg-primary group-focus:bg-primary"
              style={{ height: `${(p.total / max) * 100}%`, minHeight: p.total > 0 ? 2 : 0 }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-sm border bg-background px-2 py-1 text-xs whitespace-nowrap group-hover:block group-focus:block">
              {p.label} · {p.total}명{p.added > 0 && ` (+${p.added})`}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{points[0].label}</span>
        <span>{last.label}</span>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">표로 보기</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted-foreground">
            <tr>
              <th className="font-normal">날짜</th>
              <th className="font-normal">팔로워</th>
              <th className="font-normal">새 팔로워</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{p.label}</td>
                <td>{p.total}</td>
                <td>{p.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
