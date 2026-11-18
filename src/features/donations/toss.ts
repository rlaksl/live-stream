import "server-only";
import { AppError } from "@/lib/app-error";
import type { Payment } from "./confirm";

const API = "https://api.tosspayments.com/v1/payments";

export type TossPayment = { paymentKey: string; orderId: string; status: string; totalAmount: number };

/** 토스페이먼츠 API 호출. 시크릿 키는 Basic 인증(`키:`를 base64)으로 보낸다. */
async function call(path: string, body?: object): Promise<TossPayment> {
  const res = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body && JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new AppError(400, data.message ?? "결제 처리에 실패했습니다.");
  return data;
}

/** 결제 승인. 이 호출이 성공해야 실제로 결제가 끝난다. */
export const approvePayment = (payment: Payment) => call("/confirm", payment);

/** 결제 조회. 웹훅 내용을 믿지 않고 이 결과로 확정한다. */
export const getPayment = (paymentKey: string) => call(`/${encodeURIComponent(paymentKey)}`);
