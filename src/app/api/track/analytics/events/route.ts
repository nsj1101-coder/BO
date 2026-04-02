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

  const period = request.nextUrl.searchParams.get("period") || "7d";
  const startDate = getPeriodStart(period);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      event_type: string;
      event_name: string;
      count: bigint;
      unique_visitors: bigint;
    }>
  >(
    `SELECT
       event_type,
       event_name,
       COUNT(*) as count,
       COUNT(DISTINCT visitor_id) as unique_visitors
     FROM track_events
     WHERE created_at >= $1
     GROUP BY event_type, event_name
     ORDER BY count DESC`,
    startDate,
  );

  const events = rows.map((r) => ({
    eventType: r.event_type,
    eventName: r.event_name,
    count: Number(r.count),
    uniqueVisitors: Number(r.unique_visitors),
  }));

  return NextResponse.json(events);
}
