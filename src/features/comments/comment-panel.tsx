"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createComment, deleteComment, updateComment } from "./actions";
import type { Comment } from "./queries";

const POLL_MS = 2500;

type Props = { broadcastId: string; currentUserId: string | null; initialComments: Comment[] };

/** 방송 상세 옆(모바일은 아래)의 댓글. 몇 초마다 목록을 다시 불러온다. (docs/adr/0001: Realtime 대신 폴링) */
export function CommentPanel({ broadcastId, currentUserId, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const listRef = useRef<HTMLUListElement>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/broadcasts/${broadcastId}/comments`, { cache: "no-store" });
    if (res.ok) setComments(await res.json());
  }, [broadcastId]);

  useEffect(() => {
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  // 새 댓글이 오면 맨 아래로
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments.length]);

  /** 서버 액션을 실행하고, 성공하면 목록을 바로 다시 불러온다 */
  async function run(action: Promise<{ ok: true } | { error: string }>) {
    const result = await action;
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    await reload();
    return true;
  }

  return (
    <section className="flex h-80 flex-col rounded-xl border bg-card lg:h-[480px]">
      <h2 className="border-b px-4 py-3 text-sm font-bold">댓글 {comments.length}</h2>
      <ul ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {comments.length === 0 && <li className="text-sm text-muted-foreground">첫 댓글을 남겨보세요.</li>}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            mine={c.author_id === currentUserId}
            onUpdate={(body) => run(updateComment(c.id, body))}
            onDelete={() => run(deleteComment(c.id))}
          />
        ))}
      </ul>
      <div className="border-t p-3">
        {currentUserId ? (
          <CommentForm onSubmit={(body) => run(createComment(broadcastId, body))} />
        ) : (
          <Link
            href={`/login?next=/broadcasts/${broadcastId}`}
            className="block text-center text-sm text-primary underline"
          >
            로그인하고 댓글 쓰기
          </Link>
        )}
      </div>
    </section>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (body: string) => Promise<boolean> }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        if (await onSubmit(body)) setBody("");
        setPending(false);
      }}
    >
      <Input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={300}
        placeholder="댓글 쓰기 (최대 300자)"
        aria-label="댓글 내용"
      />
      <Button type="submit" disabled={pending || !body.trim()}>
        등록
      </Button>
    </form>
  );
}

function CommentItem({
  comment,
  mine,
  onUpdate,
  onDelete,
}: {
  comment: Comment;
  mine: boolean;
  onUpdate: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const edited = comment.updated_at !== comment.created_at;

  return (
    <li className="text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-primary">{comment.author.nickname}</span>
        <time className="text-xs text-muted-foreground">
          {new Date(comment.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          {edited && " (수정됨)"}
        </time>
        {mine && !editing && (
          <span className="ml-auto flex gap-2 text-xs text-muted-foreground">
            <button type="button" onClick={() => setEditing(true)} className="hover:text-foreground">
              수정
            </button>
            <button type="button" onClick={onDelete} className="hover:text-destructive">
              삭제
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <form
          className="mt-1 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onUpdate(draft)) setEditing(false);
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} aria-label="댓글 수정" />
          <Button type="submit" size="sm">
            저장
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            취소
          </Button>
        </form>
      ) : (
        <p className="mt-0.5 break-all whitespace-pre-wrap">{comment.body}</p>
      )}
    </li>
  );
}
