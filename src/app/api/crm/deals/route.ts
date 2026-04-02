import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const stage = searchParams.get("stage");
  const assigneeId = searchParams.get("assigneeId");

  const where = {
    ...(stage ? { stage } : {}),
    ...(assigneeId ? { assigneeId: Number(assigneeId) } : {}),
  };

  const [deals, total] = await Promise.all([
    prisma.crmDeal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, customerName: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { quotes: true, contracts: true } },
      },
    }),
    prisma.crmDeal.count({ where }),
  ]);

  return NextResponse.json({ deals, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const deal = await prisma.crmDeal.create({ data: body });
  return NextResponse.json(deal, { status: 201 });
}
