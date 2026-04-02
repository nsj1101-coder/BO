import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") || "7d";
  const limit = Number(searchParams.get("limit") || "20");
  const startDate = getPeriodStart(period);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      path: string;
      views: bigint;
      unique_visitors: bigint;
      avg_duration: number;
      avg_scroll_depth: number;
    }>
  >(
    `SELECT
       path,
       COUNT(*) as views,
       COUNT(DISTINCT visitor_id) as unique_visitors,
       ROUND(AVG(duration)) as avg_duration,
       ROUND(AVG(scroll_depth)) as avg_scroll_depth
     FROM track_page_views
     WHERE created_at >= $1
     GROUP BY path
     ORDER BY views DESC
     LIMIT $2`,
    startDate,
    limit,
  );

  const pages = rows.map((r) => ({
    path: r.path,
    views: Number(r.views),
    uniqueVisitors: Number(r.unique_visitors),
    avgDuration: Number(r.avg_duration),
    avgScrollDepth: Number(r.avg_scroll_depth),
  }));

  return NextResponse.json(pages);
}
