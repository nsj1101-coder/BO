import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    sessionId,
    visitorId,
    memberId,
    ip,
    userAgent,
    device,
    browser,
    os,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    landingPage,
  } = body;

  if (!sessionId || !visitorId) {
    return NextResponse.json({ error: "sessionId and visitorId required" }, { status: 400 });
  }

  const existing = await prisma.trackSession.findUnique({
    where: { sessionId },
  });

  if (existing) {
    const updated = await prisma.trackSession.update({
      where: { sessionId },
      data: {
        endedAt: new Date(),
        pageCount: { increment: 1 },
      },
    });
    return NextResponse.json(updated);
  }

  const previousSessions = await prisma.trackSession.count({
    where: { visitorId },
  });

  const session = await prisma.trackSession.create({
    data: {
      sessionId,
      visitorId,
      memberId: memberId ?? null,
      ip: ip ?? "",
      userAgent: userAgent ?? "",
      device: device ?? "",
      browser: browser ?? "",
      os: os ?? "",
      referrer: referrer ?? "",
      utmSource: utmSource ?? "",
      utmMedium: utmMedium ?? "",
      utmCampaign: utmCampaign ?? "",
      landingPage: landingPage ?? "",
      isNewVisitor: previousSessions === 0,
      pageCount: 1,
    },
  });

  return NextResponse.json(session);
}
