import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("templateId");

  const banners = await prisma.banner.findMany({
    where: templateId ? { templateId: Number(templateId) } : {},
    include: { template: { select: { id: true, name: true } } },
    orderBy: [{ templateId: "asc" }, { slotKey: "asc" }],
  });

  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const banner = await prisma.banner.create({ data: body });
  return NextResponse.json(banner, { status: 201 });
}
