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

  const where = { startedAt: { gte: startDate } };

  const [sessions, pageViews, bounced, newVisitors] = await Promise.all([
    prisma.trackSession.findMany({
      where,
      select: {
        visitorId: true,
        duration: true,
        pageCount: true,
        startedAt: true,
      },
    }),
    prisma.trackPageView.count({ where: { createdAt: { gte: startDate } } }),
    prisma.trackSession.count({ where: { ...where, pageCount: { lte: 1 } } }),
    prisma.trackSession.count({ where: { ...where, isNewVisitor: true } }),
  ]);

  const totalSessions = sessions.length;
  const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
  const avgDuration =
    totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions)
      : 0;
  const avgPagesPerSession =
    totalSessions > 0
      ? Math.round(
          (sessions.reduce((sum, s) => sum + s.pageCount, 0) / totalSessions) * 100,
        ) / 100
      : 0;
  const bounceRate = totalSessions > 0 ? Math.round((bounced / totalSessions) * 10000) / 100 : 0;
  const newVisitorRate =
    totalSessions > 0 ? Math.round((newVisitors / totalSessions) * 10000) / 100 : 0;

  const dailyMap = new Map<string, { sessions: number; pageViews: Set<string>; visitors: Set<string> }>();

  for (const s of sessions) {
    const dateKey = s.startedAt.toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { sessions: 0, pageViews: new Set(), visitors: new Set() });
    }
    const day = dailyMap.get(dateKey)!;
    day.sessions++;
    day.visitors.add(s.visitorId);
  }

  const pvByDate = await prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM track_page_views WHERE created_at >= $1 GROUP BY DATE(created_at)`,
    startDate,
  );

  for (const row of pvByDate) {
    const dateKey = typeof row.date === "string" ? row.date : new Date(row.date).toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { sessions: 0, pageViews: new Set(), visitors: new Set() });
    }
    dailyMap.get(dateKey)!.pageViews.add(String(row.count));
  }

  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      sessions: data.sessions,
      pageViews:
        pvByDate.find(
          (r) =>
            (typeof r.date === "string" ? r.date : new Date(r.date).toISOString().slice(0, 10)) ===
            date,
        )
          ? Number(
              pvByDate.find(
                (r) =>
                  (typeof r.date === "string"
                    ? r.date
                    : new Date(r.date).toISOString().slice(0, 10)) === date,
              )!.count,
            )
          : 0,
      visitors: data.visitors.size,
    }));

  return NextResponse.json({
    totalSessions,
    totalPageViews: pageViews,
    uniqueVisitors,
    avgDuration,
    avgPagesPerSession,
    bounceRate,
    newVisitorRate,
    dailyData,
  });
}
