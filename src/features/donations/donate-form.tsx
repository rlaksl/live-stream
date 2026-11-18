"use client";

import { useState } from "react";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonation } from "./actions";
import { AMOUNT_PRESETS, MAX_AMOUNT, MAX_MESSAGE, MIN_AMOUNT, won } from "./policy";

type Props = { broadcastId: string; appUrl: string };

/**
 * 후원 금액·메시지 입력 + 토스페이먼츠 결제창(카드·간편결제 통합결제창, 테스트 모드).
 * 후원하기를 누르면 서버에 `대기` 후원을 만든 뒤 그 orderId로 결제창을 연다.
 * 결제가 끝나면 토스가 /donations/success 또는 /donations/fail로 보낸다.
 */
export function DonateForm({ broadcastId, appUrl }: Props) {
  const [amount, setAmount] = useState(AMOUNT_PRESETS[1]);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const valid = Number.isInteger(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

  async function pay() {
    setPending(true);
    const result = await createDonation(broadcastId, amount, message);
    if ("error" in result) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    try {
      const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      await toss.payment({ customerKey: ANONYMOUS }).requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId: result.orderId,
        orderName: result.orderName,
        customerName: result.customerName,
        successUrl: `${appUrl}/donations/success`,
        failUrl: `${appUrl}/donations/fail`,
      });
    } catch (error) {
      // 결제창 닫기 등. 후원은 `대기`로 남고 합계에 들어가지 않는다.
      toast.error(error instanceof Error ? error.message : "결제를 요청하지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>금액</Label>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNT_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={!custom && amount === preset ? "default" : "outline"}
              onClick={() => {
                setCustom("");
                setAmount(preset);
              }}
            >
              {won(preset)}
            </Button>
          ))}
        </div>
        <Input
          inputMode="numeric"
          value={custom}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setCustom(digits);
            setAmount(digits ? Number(digits) : AMOUNT_PRESETS[1]);
          }}
          placeholder="직접 입력 (1,000원 이상)"
          aria-label="후원 금액 직접 입력"
          className={custom && !valid ? "border-destructive" : undefined}
        />
        {custom && !valid && (
          <p className="text-xs text-destructive">1,000원 이상 1,000,000원 이하로 입력하세요.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="donation-message">메시지 (선택)</Label>
        <Input
          id="donation-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE}
          placeholder={`방송자에게 남길 말 (최대 ${MAX_MESSAGE}자)`}
        />
      </div>

      <Button className="w-full" size="lg" onClick={pay} disabled={!valid || pending}>
        {valid ? `${won(amount)} 후원하기` : "후원하기"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        테스트 결제입니다. 실제로 돈이 빠져나가지 않습니다. 카드·간편결제 결제창이 열립니다.
      </p>
    </div>
  );
}
