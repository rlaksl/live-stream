import { describe, expect, it } from "vitest";
import { isCategory } from "./types";

describe("카테고리 값 확인", () => {
  it("정해진 카테고리만 허용", () => {
    expect(isCategory("game")).toBe(true);
    expect(isCategory("etc")).toBe(true);
    expect(isCategory("hack")).toBe(false);
    expect(isCategory(undefined)).toBe(false);
    expect(isCategory(["game"])).toBe(false);
  });
});
