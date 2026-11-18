"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { AppError, toActionError } from "@/lib/app-error";
import { getCurrentUser } from "@/features/auth/current-user";
import { getBroadcast } from "@/features/broadcasts/queries";
import { assertCanComment, assertCommentAuthor } from "./policy";
import { getComment } from "./queries";

const bodySchema = z.string().trim().min(1, "댓글을 입력하세요.").max(300, "댓글은 300자 이하입니다.");

function parseBody(body: string) {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message);
  return parsed.data;
}

export async function createComment(broadcastId: string, body: string) {
  try {
    const user = await getCurrentUser();
    assertCanComment(user);
    await getBroadcast(broadcastId); // 없는 방송이면 404
    const { error } = await createAdminClient()
      .from("comments")
      .insert({ broadcast_id: broadcastId, author_id: user.id, body: parseBody(body) });
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateComment(id: string, body: string) {
  try {
    assertCommentAuthor(await getCurrentUser(), await getComment(id));
    const { error } = await createAdminClient()
      .from("comments")
      .update({ body: parseBody(body), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteComment(id: string) {
  try {
    assertCommentAuthor(await getCurrentUser(), await getComment(id));
    const { error } = await createAdminClient().from("comments").delete().eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
