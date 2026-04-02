import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await prisma.trackSession.findMany({
    where: {
      OR: [
        { endedAt: { gte: fiveMinutesAgo } },
        { endedAt: null, startedAt: { gte: fiveMinutesAgo } },
      ],
    },
    select: {
      sessionId: true,
      visitorId: true,
      exitPage: true,
      device: true,
      startedAt: true,
    },
    orderBy: { startedAt: "desc" },
  });

  const uniqueVisitors = new Set(activeSessions.map((s) => s.visitorId));

  return NextResponse.json({
    activeVisitors: uniqueVisitors.size,
    activeSessions: activeSessions.map((s) => ({
      sessionId: s.sessionId,
      visitorId: s.visitorId,
      path: s.exitPage,
      device: s.device,
      startedAt: s.startedAt,
    })),
  });
}
