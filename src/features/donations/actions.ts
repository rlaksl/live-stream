"use server";

import { createAdminClient } from "@/lib/supabase";
import { toActionError } from "@/lib/app-error";
import { getCurrentUser } from "@/features/auth/current-user";
import { getBroadcast } from "@/features/broadcasts/queries";
import { assertCanDonate, parseDonationInput } from "./policy";

/**
 * 결제 전에 `대기` 후원을 만든다. 결제창은 돌려받은 orderId로 결제를 요청하고,
 * 승인 때 이 행에 저장된 금액과 비교한다. (docs/adr/0003)
 */
export async function createDonation(broadcastId: string, amount: number, message: string) {
  try {
    const user = await getCurrentUser();
    const broadcast = await getBroadcast(broadcastId);
    assertCanDonate(user, broadcast);
    const input = parseDonationInput({ amount, message });

    const orderId = crypto.randomUUID();
    const { error } = await createAdminClient().from("donations").insert({
      order_id: orderId,
      broadcast_id: broadcast.id,
      donor_id: user.id,
      streamer_id: broadcast.owner_id,
      amount: input.amount,
      message: input.message,
    });
    if (error) throw error;
    return {
      ok: true as const,
      orderId,
      orderName: `${broadcast.owner.nickname}님에게 후원`,
      customerName: user.nickname,
    };
  } catch (error) {
    return toActionError(error);
  }
}
