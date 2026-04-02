import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.crmDeal.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      lead: true,
      quotes: { orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "desc" } },
      assignee: { select: { id: true, name: true } },
    },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.wonLost === "won") {
    body.stage = "closed_won";
  } else if (body.wonLost === "lost") {
    body.stage = "closed_lost";
  }

  const deal = await prisma.crmDeal.update({ where: { id: Number(id) }, data: body });
  return NextResponse.json(deal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.crmDeal.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
