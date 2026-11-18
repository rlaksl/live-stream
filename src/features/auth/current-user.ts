import "server-only";
import { cache } from "react";
import { createAdminClient, createAuthClient } from "@/lib/supabase";
import { loginRequired } from "@/lib/app-error";

export type CurrentUser = { id: string; nickname: string };

/**
 * 현재 로그인한 사용자. 로그인하지 않았으면 null.
 * 모든 기능의 인증 확인은 이 함수 하나를 거친다. 한 요청 안에서는 한 번만 조회한다.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("id, nickname")
    .eq("id", user.id)
    .maybeSingle();
  return profile;
});

/** 로그인하지 않았으면 401 AppError를 던진다. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw loginRequired();
  return user;
}
