import { AppError, notFound } from "@/lib/app-error";

/** 토스가 승인한(또는 승인할) 결제 정보 */
export type Payment = { paymentKey: string; orderId: string; amount: number };

type StoredDonation = { broadcast_id: string | null; amount: number; status: "pending" | "confirmed" };

/** 확정에 쓰는 저장소 동작. 실제 구현은 queries.ts의 donationStore, 테스트는 메모리 구현. */
export type DonationStore = {
  findByOrderId(orderId: string): Promise<StoredDonation | null>;
  /** `대기`일 때만 `확정`으로 바꾸는 조건부 업데이트. 바꿨으면 true. */
  markConfirmed(payment: Payment): Promise<boolean>;
};

/**
 * 후원 확정. 결제 성공 리다이렉트와 토스 웹훅이 이 함수 하나를 쓴다. (docs/adr/0003)
 * - 저장된 후원 금액과 결제 금액이 다르면 거절한다.
 * - 이미 확정된 후원이면 아무것도 하지 않는다. 동시에 들어와도 조건부 업데이트라 한 번만 확정된다.
 * - approve: 리다이렉트는 토스 승인 API를 호출한다. 웹훅은 조회로 이미 승인(DONE)을 확인했으므로 넘기지 않는다.
 */
export async function confirmDonation(store: DonationStore, payment: Payment, approve?: () => Promise<unknown>) {
  const donation = await store.findByOrderId(payment.orderId);
  if (!donation) throw notFound("후원");
  if (donation.amount !== payment.amount) {
    throw new AppError(400, "결제 금액이 후원 금액과 다릅니다.");
  }
  if (donation.status === "confirmed") return donation;

  await approve?.();
  await store.markConfirmed(payment);
  return donation;
}
