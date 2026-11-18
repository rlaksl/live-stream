import { describe, expect, it } from "vitest";
import { formatKst, isoToKstInput, kstDate, kstInputToIso, startOfTodayKst } from "./schedule";

describe("방송 예정 시각(KST)", () => {
  it("입력값을 KST로 해석해 저장한다", () => {
    expect(kstInputToIso("2026-11-20T20:00")).toBe("2026-11-20T11:00:00.000Z");
  });
  it("빈 값은 예정 없음", () => expect(kstInputToIso("")).toBeNull());
  it("잘못된 값은 거부", () => expect(() => kstInputToIso("내일 저녁")).toThrow());
  it("저장값을 다시 입력값으로", () => {
    expect(isoToKstInput("2026-11-20T11:00:00.000Z")).toBe("2026-11-20T20:00");
    expect(isoToKstInput(null)).toBe("");
  });
  it("표시: 11/20(금) 20:00", () => expect(formatKst("2026-11-20T11:00:00.000Z")).toBe("11/20(금) 20:00"));
  it("KST 날짜: UTC로는 전날이어도 KST 날짜로 묶는다", () => {
    expect(kstDate("2026-11-19T16:30:00.000Z")).toBe("2026-11-20");
  });
  it("오늘 0시(KST)", () => {
    expect(startOfTodayKst(new Date("2026-11-19T16:30:00.000Z"))).toBe("2026-11-19T15:00:00.000Z");
  });
});
