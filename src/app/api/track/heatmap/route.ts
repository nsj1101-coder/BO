import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path, x, y, viewportW, viewportH, target, sessionId } = body;

  if (!path || x == null || y == null || !viewportW || !viewportH || !sessionId) {
    return NextResponse.json(
      { error: "path, x, y, viewportW, viewportH, and sessionId required" },
      { status: 400 },
    );
  }

  const click = await prisma.trackHeatmapClick.create({
    data: {
      path,
      x,
      y,
      viewportW,
      viewportH,
      target: target ?? "",
      sessionId,
    },
  });

  return NextResponse.json(click);
}
