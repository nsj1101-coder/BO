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

  const [referrerRows, utmRows, deviceRows, browserRows, totalResult] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ referrer: string; sessions: bigint }>>(
      `SELECT referrer, COUNT(*) as sessions
       FROM track_sessions
       WHERE started_at >= $1 AND referrer != ''
       GROUP BY referrer
       ORDER BY sessions DESC`,
      startDate,
    ),
    prisma.$queryRawUnsafe<
      Array<{ utm_source: string; utm_medium: string; utm_campaign: string; sessions: bigint }>
    >(
      `SELECT utm_source, utm_medium, utm_campaign, COUNT(*) as sessions
       FROM track_sessions
       WHERE started_at >= $1 AND utm_source != ''
       GROUP BY utm_source, utm_medium, utm_campaign
       ORDER BY sessions DESC`,
      startDate,
    ),
    prisma.$queryRawUnsafe<Array<{ device: string; sessions: bigint }>>(
      `SELECT device, COUNT(*) as sessions
       FROM track_sessions
       WHERE started_at >= $1 AND device != ''
       GROUP BY device
       ORDER BY sessions DESC`,
      startDate,
    ),
    prisma.$queryRawUnsafe<Array<{ browser: string; sessions: bigint }>>(
      `SELECT browser, COUNT(*) as sessions
       FROM track_sessions
       WHERE started_at >= $1 AND browser != ''
       GROUP BY browser
       ORDER BY sessions DESC`,
      startDate,
    ),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM track_sessions WHERE started_at >= $1`,
      startDate,
    ),
  ]);

  const totalSessions = Number(totalResult[0]?.count ?? 0);

  const referrers = referrerRows.map((r) => ({
    referrer: r.referrer,
    sessions: Number(r.sessions),
    percentage: totalSessions > 0 ? Math.round((Number(r.sessions) / totalSessions) * 10000) / 100 : 0,
  }));

  const utmSources = utmRows.map((r) => ({
    source: r.utm_source,
    medium: r.utm_medium,
    campaign: r.utm_campaign,
    sessions: Number(r.sessions),
  }));

  const devices = deviceRows.map((r) => ({
    device: r.device,
    sessions: Number(r.sessions),
    percentage: totalSessions > 0 ? Math.round((Number(r.sessions) / totalSessions) * 10000) / 100 : 0,
  }));

  const browsers = browserRows.map((r) => ({
    browser: r.browser,
    sessions: Number(r.sessions),
    percentage: totalSessions > 0 ? Math.round((Number(r.sessions) / totalSessions) * 10000) / 100 : 0,
  }));

  return NextResponse.json({ referrers, utmSources, devices, browsers });
}
