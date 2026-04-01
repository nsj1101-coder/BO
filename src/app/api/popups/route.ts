import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const popups = await prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(popups);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const popup = await prisma.popup.create({ data: body });
  return NextResponse.json(popup, { status: 201 });
}
