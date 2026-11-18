import { DonationResult } from "@/features/donations/donation-result";
import { donationStore } from "@/features/donations/queries";

/** 토스 결제 실패·취소 리다이렉트. 후원은 `대기`로 남고 합계에 들어가지 않는다. */
export default async function DonationFailPage({ searchParams }: PageProps<"/donations/fail">) {
  const { message, orderId } = await searchParams;
  const donation = typeof orderId === "string" ? await donationStore.findByOrderId(orderId) : null;
  return (
    <DonationResult
      ok={false}
      title="후원하지 못했습니다"
      message={typeof message === "string" ? message : "결제가 취소되었거나 실패했습니다."}
      broadcastId={donation?.broadcast_id ?? null}
    />
  );
}
