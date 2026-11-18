/**
 * 방송 예정 시각은 한국 시간(KST) 기준으로 입력·표시한다. 서버(Vercel)는 UTC로 돌기 때문에
 * 브라우저 입력값(`2026-11-20T20:00`, 시간대 없음)을 KST로 해석해 저장한다.
 */
const KST_OFFSET = "+09:00";
const TIME_ZONE = "Asia/Seoul";

/** `<input type="datetime-local">` 값(KST) → 저장할 ISO 시각. 빈 값은 null(예정 없음). */
export function kstInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}${KST_OFFSET}`);
  if (Number.isNaN(date.getTime())) throw new Error(`잘못된 시각: ${value}`);
  return date.toISOString();
}

/** 저장된 ISO 시각 → 수정 화면 입력값(KST, 분 단위) */
export function isoToKstInput(iso: string | null): string {
  if (!iso) return "";
  // sv-SE 형식은 "2026-11-20 20:00"이라 T만 넣으면 입력값이 된다
  return new Date(iso)
    .toLocaleString("sv-SE", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .replace(" ", "T");
}

/** "11/20(금) 20:00" */
export function formatKst(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: TIME_ZONE,
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.month}/${parts.day}(${parts.weekday}) ${parts.hour}:${parts.minute}`;
}

/** 편성표의 날짜 묶음 기준: KST 날짜 "2026-11-20" */
export function kstDate(iso: string): string {
  return isoToKstInput(iso).slice(0, 10);
}

/** 오늘 0시(KST)의 ISO 시각. 편성표는 오늘부터 보여준다. */
export function startOfTodayKst(now = new Date()): string {
  return new Date(`${kstDate(now.toISOString())}T00:00${KST_OFFSET}`).toISOString();
}
