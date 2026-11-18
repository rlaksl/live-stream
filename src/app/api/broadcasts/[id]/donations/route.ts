import { listDonations } from "@/features/donations/queries";

/** 방송별 확정 후원 내역과 합계 (누구나 조회 가능). 방송 상세의 후원 패널이 몇 초마다 다시 불러온다. */
export async function GET(_: Request, { params }: RouteContext<"/api/broadcasts/[id]/donations">) {
  const { id } = await params;
  return Response.json(await listDonations(id), { headers: { "Cache-Control": "no-store" } });
}
