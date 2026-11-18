import { AppError } from "@/lib/app-error";
import { confirmDonation } from "@/features/donations/confirm";
import { DonationResult } from "@/features/donations/donation-result";
import { won } from "@/features/donations/policy";
import { donationStore } from "@/features/donations/queries";
import { approvePayment } from "@/features/donations/toss";

/**
 * 토스 결제 성공 리다이렉트. 저장된 후원 금액과 비교한 뒤 승인 API를 호출해 확정한다. (docs/adr/0003)
 * 새로고침해도 이미 확정된 후원은 다시 승인하지 않는다.
 */
export default async function DonationSuccessPage({ searchParams }: PageProps<"/donations/success">) {
  const { paymentKey, orderId, amount } = await searchParams;
  if (typeof paymentKey !== "string" || typeof orderId !== "string" || typeof amount !== "string") {
    return <DonationResult ok={false} title="후원 실패" message="잘못된 결제 정보입니다." broadcastId={null} />;
  }

  const payment = { paymentKey, orderId, amount: Number(amount) };
  let broadcastId: string | null;
  try {
    const donation = await confirmDonation(donationStore, payment, () => approvePayment(payment));
    broadcastId = donation.broadcast_id;
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return <DonationResult ok={false} title="후원 실패" message={error.message} broadcastId={null} />;
  }
  return (
    <DonationResult
      ok
      title="후원 완료"
      message={`${won(payment.amount)}을 후원했습니다. 고맙습니다!`}
      broadcastId={broadcastId}
    />
  );
}
