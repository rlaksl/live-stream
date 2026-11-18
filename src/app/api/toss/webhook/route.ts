import { AppError } from "@/lib/app-error";
import { confirmDonation } from "@/features/donations/confirm";
import { donationStore } from "@/features/donations/queries";
import { getPayment } from "@/features/donations/toss";

/**
 * 토스페이먼츠 결제 웹훅. 내용은 "확인해 보라"는 신호로만 쓰고,
 * 토스에 결제를 다시 조회해 승인(DONE)이면 리다이렉트와 같은 확정 함수로 확정한다. (docs/adr/0003)
 * 5xx를 돌려주면 토스가 다시 보내므로, 처리할 수 없는 통지(없는 결제·주문, 금액 불일치)는 200으로 끝낸다.
 */
export async function POST(request: Request) {
  const event = await request.json().catch(() => null);
  const paymentKey = event?.data?.paymentKey;
  if (event?.eventType !== "PAYMENT_STATUS_CHANGED" || typeof paymentKey !== "string") {
    return new Response("ignored");
  }

  try {
    const payment = await getPayment(paymentKey);
    if (payment.status !== "DONE") return new Response("not done");
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
