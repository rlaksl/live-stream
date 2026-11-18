import { listComments } from "@/features/comments/queries";

/** 댓글 목록 (누구나 조회 가능). 방송 상세의 댓글 패널이 몇 초마다 다시 불러온다. */
export async function GET(_: Request, { params }: RouteContext<"/api/broadcasts/[id]/comments">) {
  const { id } = await params;
  return Response.json(await listComments(id), { headers: { "Cache-Control": "no-store" } });
}
