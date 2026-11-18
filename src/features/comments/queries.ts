import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { notFound } from "@/lib/app-error";

export type Comment = {
  id: string;
  broadcast_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: { nickname: string };
};

const SELECT = "id, broadcast_id, author_id, body, created_at, updated_at, author:profiles(nickname)";

/** 방송의 댓글 (오래된 것부터, 최근 200개) */
export async function listComments(broadcastId: string): Promise<Comment[]> {
  if (!z.uuid().safeParse(broadcastId).success) return [];
  const { data, error } = await createAdminClient()
    .from("comments")
    .select(SELECT)
    .eq("broadcast_id", broadcastId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Comment[]>();
  if (error) throw error;
  return data.reverse();
}

export async function getComment(id: string): Promise<Comment> {
  if (!z.uuid().safeParse(id).success) throw notFound("댓글");
  const { data, error } = await createAdminClient()
    .from("comments")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle<Comment>();
  if (error) throw error;
  if (!data) throw notFound("댓글");
  return data;
}
