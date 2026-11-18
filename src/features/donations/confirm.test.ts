import { describe, expect, it, vi } from "vitest";
import { confirmDonation, type DonationStore } from "./confirm";

/** donations 테이블 대신 쓰는 메모리 저장소. markConfirmed는 실제와 같이 `대기`일 때만 바꾼다. */
function memoryStore(amount: number) {
  const row = { broadcast_id: "b1", amount, status: "pending" as "pending" | "confirmed", payment_key: null as string | null };
  const store: DonationStore = {
    findByOrderId: async (orderId) => (orderId === "order-1" ? { ...row } : null),
    markConfirmed: async ({ paymentKey }) => {
      await Promise.resolve(); // 다른 요청이 끼어들 틈
      if (row.status !== "pending") return false;
      row.status = "confirmed";
      row.payment_key = paymentKey;
      return true;
    },
  };
  /** 합계에 들어가는 금액 = 확정된 후원 금액 */
  const total = () => (row.status === "confirmed" ? row.amount : 0);
  return { store, row, total };
}

const payment = { paymentKey: "pk-1", orderId: "order-1", amount: 5000 };

describe("후원 확정", () => {
  it("금액이 일치하면 승인 후 확정한다", async () => {
    const { store, row } = memoryStore(5000);
    const approve = vi.fn(async () => {});
    await confirmDonation(store, payment, approve);
    expect(approve).toHaveBeenCalledOnce();
    expect(row).toMatchObject({ status: "confirmed", payment_key: "pk-1" });
  });

  it("저장된 금액과 결제 금액이 다르면 승인하지 않고 거절한다", async () => {
    const { store, row } = memoryStore(5000);
    const approve = vi.fn(async () => {});
    await expect(confirmDonation(store, { ...payment, amount: 1000 }, approve)).rejects.toMatchObject({
      status: 400,
    });
    expect(approve).not.toHaveBeenCalled();
    expect(row.status).toBe("pending");
  });

  it("없는 주문은 404", async () => {
    const { store } = memoryStore(5000);
    await expect(confirmDonation(store, { ...payment, orderId: "nope" })).rejects.toMatchObject({ status: 404 });
  });

  it("같은 통지가 반복돼도(동시 포함) 한 번만 적립한다", async () => {
    const { store, total } = memoryStore(5000);
    const markConfirmed = vi.spyOn(store, "markConfirmed");
    // 리다이렉트 + 웹훅 재전송 여러 번이 동시에 들어온 경우
    await Promise.all([
      confirmDonation(store, payment, async () => {}),
      confirmDonation(store, payment),
      confirmDonation(store, payment),
    ]);
    await confirmDonation(store, payment); // 나중에 온 재전송
    expect((await Promise.all(markConfirmed.mock.results.map((r) => r.value)))).toEqual([true, false, false]);
    expect(total()).toBe(5000);
  });

  it("이미 확정된 후원은 승인 API를 다시 부르지 않는다", async () => {
    const { store } = memoryStore(5000);
    await confirmDonation(store, payment, async () => {});
    const approve = vi.fn(async () => {});
    await confirmDonation(store, payment, approve); // 성공 페이지 새로고침
    expect(approve).not.toHaveBeenCalled();
  });
});
