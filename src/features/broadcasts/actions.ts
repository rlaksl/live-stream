"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import { toActionError } from "@/lib/app-error";
import { getCurrentUser, requireUser } from "@/features/auth/current-user";
import { endLive } from "@/features/live/end-live";
import { deleteRecordingFiles } from "@/features/recordings/egress";
import { assertOwner } from "./policy";
import { getBroadcast } from "./queries";
import { CATEGORIES } from "./types";

export type BroadcastFormState = { error: string } | undefined;

const broadcastSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(100, "제목은 100자 이하입니다."),
  description: z.string().trim().max(1000, "설명은 1000자 이하입니다."),
  category: z.enum(CATEGORIES, "카테고리를 고르세요."),
});

export async function createBroadcast(
  _: BroadcastFormState,
  formData: FormData,
): Promise<BroadcastFormState> {
  let id: string;
  try {
    const user = await requireUser();
    const parsed = broadcastSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { data, error } = await createAdminClient()
      .from("broadcasts")
      .insert({ ...parsed.data, owner_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  } catch (error) {
    return toActionError(error);
  }
  redirect(`/broadcasts/${id}/studio`);
}

export async function updateBroadcast(
  id: string,
  _: BroadcastFormState,
  formData: FormData,
): Promise<BroadcastFormState> {
  try {
    const broadcast = await getBroadcast(id);
    assertOwner(await getCurrentUser(), broadcast);
    const parsed = broadcastSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { error } = await createAdminClient()
      .from("broadcasts")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } catch (error) {
    return toActionError(error);
  }
  redirect(`/broadcasts/${id}`);
}

/** 방송 중이면 먼저 종료하고 삭제한다. 댓글·녹화(파일 포함)는 함께 지워지고 후원 기록은 남는다. */
export async function deleteBroadcast(id: string): Promise<BroadcastFormState> {
  try {
    const broadcast = await getBroadcast(id);
    assertOwner(await getCurrentUser(), broadcast);

    if (broadcast.status === "live") await endLive(id);
    await deleteRecordingFiles(id);
    const { error } = await createAdminClient().from("broadcasts").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    return toActionError(error);
  }
  redirect("/");
}
