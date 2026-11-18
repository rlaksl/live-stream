import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error";
import { assertCanComment, assertCommentAuthor } from "./policy";

const author = { id: "author", nickname: "작성자" };
const other = { id: "other", nickname: "다른사람" };
const comment = { author_id: author.id };

function result(fn: () => void) {
  try {
    fn();
    return "ok";
  } catch (error) {
    if (error instanceof AppError) return error.status;
    throw error;
  }
}

describe("댓글 작성", () => {
  it("비로그인은 401", () => expect(result(() => assertCanComment(null))).toBe(401));
  it("로그인 사용자는 허용", () => expect(result(() => assertCanComment(other))).toBe("ok"));
});

describe("댓글 수정·삭제 (작성자만)", () => {
  it("비로그인은 401", () => expect(result(() => assertCommentAuthor(null, comment))).toBe(401));
  it("다른 사용자는 403", () => expect(result(() => assertCommentAuthor(other, comment))).toBe(403));
  it("작성자는 허용", () => expect(result(() => assertCommentAuthor(author, comment))).toBe("ok"));
});
