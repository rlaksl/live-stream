import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import type { DonationStore } from "./confirm";

export type DonationItem = {
  id: string;
  amount: number;
  message: string;
  confirmed_at: string;
  donor: { nickname: string };
};

export type DonationSummary = { total: number; items: DonationItem[] };

/** 방송별 확정 후원 내역(최신순)과 합계 */
export async function listDonations(broadcastId: string): Promise<DonationSummary> {
  if (!z.uuid().safeParse(broadcastId).success) return { total: 0, items: [] };
  const { data, error } = await createAdminClient()
    .from("donations")
    // donor_id·streamer_id 둘 다 profiles를 가리키므로 어느 쪽인지 지정한다
    .select("id, amount, message, confirmed_at, donor:profiles!donor_id(nickname)")
    .eq("broadcast_id", broadcastId)
    .eq("status", "confirmed")
    .order("confirmed_at", { ascending: false })
    .returns<DonationItem[]>();
  if (error) throw error;
  return { total: data.reduce((sum, d) => sum + d.amount, 0), items: data };
}

export const donationStore: DonationStore = {
  async findByOrderId(orderId) {
    const { data, error } = await createAdminClient()
      .from("donations")
      .select("broadcast_id, amount, status")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async markConfirmed({ orderId, paymentKey }) {
    const { data, error } = await createAdminClient()
      .from("donations")
      .update({ status: "confirmed", payment_key: paymentKey, confirmed_at: new Date().toISOString() })
      .eq("order_id", orderId)
      .eq("status", "pending")
      .select("id");
    if (error) throw error;
    return data.length > 0;
  },
};
