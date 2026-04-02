import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, visitorId, memberId, path, title, referrer, duration, scrollDepth } = body;

  if (!sessionId || !visitorId || !path) {
    return NextResponse.json({ error: "sessionId, visitorId, and path required" }, { status: 400 });
  }

  const [pageView] = await Promise.all([
    prisma.trackPageView.create({
      data: {
        sessionId,
        visitorId,
        memberId: memberId ?? null,
        path,
        title: title ?? "",
        referrer: referrer ?? "",
        duration: duration ?? 0,
        scrollDepth: scrollDepth ?? 0,
      },
    }),
    prisma.trackSession.update({
      where: { sessionId },
      data: {
        pageCount: { increment: 1 },
        exitPage: path,
        endedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json(pageView);
}
