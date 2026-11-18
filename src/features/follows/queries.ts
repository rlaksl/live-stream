import "server-only";
import { createAdminClient } from "@/lib/supabase";

/** 방송자의 팔로워 수와, 현재 사용자가 팔로우 중인지 */
export async function getFollowState(broadcasterId: string, userId: string | null) {
  const db = createAdminClient();
  const [{ count, error }, mine] = await Promise.all([
    db.from("follows").select("*", { count: "exact", head: true }).eq("broadcaster_id", broadcasterId),
    userId
      ? db.from("follows").select("broadcaster_id").eq("follower_id", userId).eq("broadcaster_id", broadcasterId)
      : null,
  ]);
  if (error) throw error;
  if (mine?.error) throw mine.error;
  return { count: count ?? 0, following: (mine?.data?.length ?? 0) > 0 };
}

/** 사용자가 팔로우한 방송자 id 목록 */
export async function listFollowedIds(userId: string) {
  const { data, error } = await createAdminClient()
    .from("follows")
    .select("broadcaster_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return new Set(data.map((f) => f.broadcaster_id as string));
}

export type FollowPerson = { id: string; nickname: string; since: string };

/** 마이페이지: 나를 팔로우한 사람(본인만 본다) */
export async function listFollowers(userId: string): Promise<FollowPerson[]> {
  const { data, error } = await createAdminClient()
    .from("follows")
    .select("created_at, follower:profiles!follower_id(id, nickname)")
    .eq("broadcaster_id", userId)
    .order("created_at", { ascending: false })
    .returns<{ created_at: string; follower: { id: string; nickname: string } }[]>();
  if (error) throw error;
  return data.map((f) => ({ ...f.follower, since: f.created_at }));
}

/** 마이페이지: 내가 팔로우한 방송자 */
export async function listFollowing(userId: string): Promise<FollowPerson[]> {
  const { data, error } = await createAdminClient()
    .from("follows")
    .select("created_at, broadcaster:profiles!broadcaster_id(id, nickname)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .returns<{ created_at: string; broadcaster: { id: string; nickname: string } }[]>();
  if (error) throw error;
  return data.map((f) => ({ ...f.broadcaster, since: f.created_at }));
}
