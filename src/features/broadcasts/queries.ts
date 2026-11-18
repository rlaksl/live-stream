import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { notFound } from "@/lib/app-error";
import { startOfTodayKst } from "./schedule";
import type { Broadcast, Category } from "./types";

const SELECT = "id, owner_id, title, description, category, status, record_enabled, scheduled_at, started_at, ended_at, created_at, owner:profiles(nickname)";

export async function findBroadcast(id: string): Promise<Broadcast | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { data, error } = await createAdminClient()
    .from("broadcasts")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle<Broadcast>();
  if (error) throw error;
  return data;
}

export async function getBroadcast(id: string): Promise<Broadcast> {
  const broadcast = await findBroadcast(id);
  if (!broadcast) throw notFound("방송");
  return broadcast;
}

/** 방송 목록(최신순). live: 방송 중만, all: 전체. category를 주면 그 카테고리만. */
export async function listBroadcasts(filter: "live" | "all", category?: Category): Promise<Broadcast[]> {
  let query = createAdminClient()
    .from("broadcasts")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(60);
  if (filter === "live") query = query.eq("status", "live");
  if (category) query = query.eq("category", category);
  const { data, error } = await query.returns<Broadcast[]>();
  if (error) throw error;
  return data;
}

/** 편성표: 오늘(KST) 이후로 예정된 대기 중인 방송, 예정 시각순 */
export async function listScheduled(): Promise<Broadcast[]> {
  const { data, error } = await createAdminClient()
    .from("broadcasts")
    .select(SELECT)
    .eq("status", "waiting")
    .gte("scheduled_at", startOfTodayKst())
    .order("scheduled_at")
    .limit(60)
    .returns<Broadcast[]>();
  if (error) throw error;
  return data;
}
