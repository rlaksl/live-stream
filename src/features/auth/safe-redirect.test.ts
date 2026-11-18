import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("로그인 후 돌아갈 주소", () => {
  it.each(["/", "/broadcasts/new", "/broadcasts/abc/studio?x=1"])("내부 경로 %s는 그대로", (path) => {
    expect(safeRedirect(path)).toBe(path);
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "evil.com", ""])("외부·이상한 주소 %s는 홈으로", (path) => {
    expect(safeRedirect(path)).toBe("/");
  });
});
