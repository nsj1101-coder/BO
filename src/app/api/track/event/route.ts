import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, visitorId, memberId, eventType, eventName, path, target, value, metadata } =
    body;

  if (!sessionId || !visitorId || !eventType || !eventName) {
    return NextResponse.json(
      { error: "sessionId, visitorId, eventType, and eventName required" },
      { status: 400 },
    );
  }

  const event = await prisma.trackEvent.create({
    data: {
      sessionId,
      visitorId,
      memberId: memberId ?? null,
      eventType,
      eventName,
      path: path ?? "",
      target: target ?? "",
      value: value ?? "",
      metadata: metadata ? JSON.stringify(metadata) : "{}",
    },
  });

  return NextResponse.json(event);
}
