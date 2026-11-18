"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { won } from "@/features/donations/policy";
import { createComment, deleteComment, updateComment } from "./actions";
import { mergeFeed, type DonationNote } from "./feed";
import type { Comment } from "./queries";

const POLL_MS = 2500;

type Props = {
  broadcastId: string;
  /** 방송자. 댓글에서 닉네임을 형광펜으로 표시한다. */
  ownerId: string;
  currentUserId: string | null;
  initialComments: Comment[];
  /** 메시지 있는 확정 후원. 댓글과 시간순으로 섞어 보여준다. */
  donations: DonationNote[];
};

/**
 * 방송 상세 옆(모바일은 아래)의 댓글. 몇 초마다 목록을 다시 불러온다. (docs/adr/0001: Realtime 대신 폴링)
 * 후원 메시지도 여기에 함께 보여준다(수정·삭제 없음).
 */
export function CommentPanel({ broadcastId, ownerId, currentUserId, initialComments, donations }: Props) {
  const [comments, setComments] = useState(initialComments);
  const listRef = useRef<HTMLUListElement>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/broadcasts/${broadcastId}/comments`, {
      cache: "no-store",
    });
    if (res.ok) setComments(await res.json());
  }, [broadcastId]);

  useEffect(() => {
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  const feed = mergeFeed(comments, donations);

  // 새 댓글·후원이 오면 맨 아래로
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [feed.length]);

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
    <section
      aria-labelledby="comments-title"
      className="flex h-96 flex-col gap-4 rounded-sm border bg-card p-5 lg:h-[520px]"
    >
      <h2 id="comments-title" className="font-bold">
        댓글 {comments.length}
      </h2>
      <ul ref={listRef} className="flex flex-1 flex-col gap-3.5 overflow-y-auto">
        {feed.length === 0 && <li className="text-sm text-muted-foreground">첫 댓글을 남겨보세요.</li>}
        {feed.map((item) =>
          item.kind === "donation" ? (
            <DonationItem key={`d-${item.donation.id}`} donation={item.donation} />
          ) : (
            <CommentItem
              key={item.comment.id}
              comment={item.comment}
              byOwner={item.comment.author_id === ownerId}
              mine={item.comment.author_id === currentUserId}
              onUpdate={(body) => run(updateComment(item.comment.id, body))}
              onDelete={() => run(deleteComment(item.comment.id))}
            />
          ),
        )}
      </ul>
      <div>
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
        placeholder="댓글을 입력하세요"
        aria-label="댓글 내용"
        className="h-11 bg-background"
      />
      <Button
        type="submit"
        disabled={pending || !body.trim()}
        className="h-11 bg-foreground px-4 font-bold text-background hover:bg-foreground/80"
      >
        등록
      </Button>
    </form>
  );
}

/** 댓글창의 후원 메시지: 형광펜 닉네임 + 금액. 댓글과 달리 수정·삭제가 없다. */
function DonationItem({ donation }: { donation: DonationNote }) {
  return (
    <li className="flex flex-col gap-1 border-l-2 border-primary pl-2.5 text-sm">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="highlight text-[13px] font-bold">{donation.donor.nickname}</span>
        <span className="font-bold text-primary">{won(donation.amount)} 후원</span>
      </div>
      <p className="leading-normal whitespace-pre-wrap text-[#e4e4e7]">{donation.message}</p>
    </li>
  );
}

function CommentItem({
  comment,
  byOwner,
  mine,
  onUpdate,
  onDelete,
}: {
  comment: Comment;
  byOwner: boolean;
  mine: boolean;
  onUpdate: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const edited = comment.updated_at !== comment.created_at;

  return (
    <li className="flex flex-col gap-1 text-sm">
      <div className="flex items-baseline gap-2">
        <span className={cn("text-[13px] font-bold", byOwner ? "highlight" : mine ? "text-primary" : "text-[#d4d4d8]")}>
          {comment.author.nickname}
        </span>
        <time className="text-xs text-muted-foreground">
          {/* 서버(UTC)와 브라우저의 시간대가 달라도 같은 글자가 나오게 KST로 고정한다 */}
          {new Date(comment.created_at).toLocaleTimeString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
        <p className="leading-normal whitespace-pre-wrap text-[#e4e4e7]">{comment.body}</p>
      )}
    </li>
  );
}
