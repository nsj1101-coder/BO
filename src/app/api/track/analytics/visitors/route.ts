import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      visitor_id: string;
      sessions: bigint;
      last_seen: Date;
      total_page_views: bigint;
      device: string;
      browser: string;
      country: string;
    }>
  >(
    `SELECT
       visitor_id,
       COUNT(*) as sessions,
       MAX(started_at) as last_seen,
       SUM(page_count) as total_page_views,
       (ARRAY_AGG(device ORDER BY started_at DESC))[1] as device,
       (ARRAY_AGG(browser ORDER BY started_at DESC))[1] as browser,
       (ARRAY_AGG(country ORDER BY started_at DESC))[1] as country
     FROM track_sessions
     GROUP BY visitor_id
     ORDER BY last_seen DESC
     LIMIT $1 OFFSET $2`,
    limit,
    offset,
  );

  const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(DISTINCT visitor_id) as count FROM track_sessions`,
  );

  const total = Number(totalResult[0]?.count ?? 0);

  const visitors = rows.map((r) => ({
    visitorId: r.visitor_id,
    sessions: Number(r.sessions),
    lastSeen: r.last_seen,
    totalPageViews: Number(r.total_page_views),
    device: r.device,
    browser: r.browser,
    country: r.country,
  }));

  return NextResponse.json({ visitors, total });
}
