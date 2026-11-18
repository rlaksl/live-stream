import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { playlistUrl, syncRecording } from "./egress";

export type Recording = {
  id: string;
  broadcast_id: string;
  egress_id: string;
  status: "recording" | "ready" | "failed";
  playlist_path: string;
  started_at: string;
  ended_at: string | null;
  broadcast: { title: string; owner: { nickname: string } };
};

const SELECT = "id, broadcast_id, egress_id, status, playlist_path, started_at, ended_at, broadcast:broadcasts(title, owner:profiles(nickname))";

/** 다시보기 목록: 저장이 끝난 녹화만, 최신순 */
export async function listRecordings(limit = 60): Promise<(Recording & { url: string })[]> {
  const { data, error } = await createAdminClient()
    .from("recordings")
    .select(SELECT)
    .eq("status", "ready")
    .order("started_at", { ascending: false })
    .limit(limit)
    .returns<Recording[]>();
  if (error) throw error;
  return data.map((r) => ({ ...r, url: playlistUrl(r.playlist_path) }));
}

export async function findRecording(id: string): Promise<(Recording & { url: string }) | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const query = () => createAdminClient().from("recordings").select(SELECT).eq("id", id).maybeSingle<Recording>();

  let { data, error } = await query();
  if (data?.status === "recording") {
    await syncRecording(data.egress_id);
    ({ data, error } = await query());
  }
  if (error) throw error;
  return data && { ...data, url: playlistUrl(data.playlist_path) };
}

/** 방송 상세의 녹화 상태 안내용 (방송당 녹화는 최대 1개) */
export async function findRecordingOfBroadcast(broadcastId: string) {
  const query = () =>
    createAdminClient()
      .from("recordings")
      .select("id, egress_id, status")
      .eq("broadcast_id", broadcastId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<Recording, "id" | "egress_id" | "status">>();

  let { data, error } = await query();
  if (data?.status === "recording") {
    await syncRecording(data.egress_id);
    ({ data, error } = await query());
  }
  if (error) throw error;
  return data;
}

export function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "";
  const seconds = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
