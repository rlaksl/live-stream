import { AppError } from "@/lib/app-error";
import { confirmDonation } from "@/features/donations/confirm";
import { donationStore } from "@/features/donations/queries";
import { getPayment, type TossPayment } from "@/features/donations/toss";

/**
 * 토스페이먼츠 결제 웹훅. 내용은 "확인해 보라"는 신호로만 쓰고,
 * 토스에 결제를 다시 조회해 승인(DONE)이면 리다이렉트와 같은 확정 함수로 확정한다. (docs/adr/0003)
 * - 조회가 실패하면(키·IP 정책 오류, 일시 장애) 502를 돌려준다. 토스가 나중에 다시 보내 그때 확정된다.
 * - 처리할 수 없는 통지(없는 주문, 금액 불일치)는 다시 받아도 같으므로 200으로 끝낸다.
 */
export async function POST(request: Request) {
  const event = await request.json().catch(() => null);
  const paymentKey = event?.data?.paymentKey;
  if (event?.eventType !== "PAYMENT_STATUS_CHANGED" || typeof paymentKey !== "string") {
    return new Response("ignored");
  }

  let payment: TossPayment;
  try {
    payment = await getPayment(paymentKey);
  } catch (error) {
    console.error("[toss webhook] 결제 조회 실패", paymentKey, error);
    return new Response("payment lookup failed", { status: 502 });
  }
  if (payment.status !== "DONE") return new Response("not done");

  try {
    await confirmDonation(donationStore, {
      paymentKey: payment.paymentKey,
      orderId: payment.orderId,
      amount: payment.totalAmount,
    });
    return new Response("ok");
  } catch (error) {
    if (error instanceof AppError) return new Response(`ignored: ${error.message}`);
    throw error;
  }
}
