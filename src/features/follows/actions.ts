"use server";

import { createAdminClient } from "@/lib/supabase";
import { notFound, toActionError } from "@/lib/app-error";
import { getCurrentUser } from "@/features/auth/current-user";
import { assertCanFollow, assertCanUnfollow } from "./policy";

export async function follow(broadcasterId: string) {
  try {
    const user = await getCurrentUser();
    assertCanFollow(user, broadcasterId);
    const { error } = await createAdminClient()
      .from("follows")
      .insert({ follower_id: user.id, broadcaster_id: broadcasterId });
    // 23505: 이미 팔로우 중(두 번 눌러도 결과는 같다), 23503: 없는 사용자
    if (error?.code === "23503") throw notFound("방송자");
    if (error && error.code !== "23505") throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}

/** 로그인한 사용자 자신의 팔로우만 지운다 */
export async function unfollow(broadcasterId: string) {
  try {
    const user = await getCurrentUser();
    assertCanUnfollow(user);
    const { error } = await createAdminClient()
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("broadcaster_id", broadcasterId);
    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    return toActionError(error);
  }
}
