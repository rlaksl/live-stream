import { createAdminClient } from "@/lib/supabase";

/**
 * Supabase 무료 요금제의 7일 비활성 일시중지를 막기 위해 Vercel 크론이 하루 한 번 부른다(vercel.json).
 * Vercel은 `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여 호출한다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const { count, error } = await createAdminClient()
    .from("broadcasts")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return Response.json({ ok: true, broadcasts: count });
}
