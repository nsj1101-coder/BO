import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const priority = searchParams.get("priority");

  const where = {
    ...(status ? { status } : {}),
    ...(assigneeId ? { assigneeId: Number(assigneeId) } : {}),
    ...(priority ? { priority } : {}),
  };

  const [followups, total] = await Promise.all([
    prisma.crmFollowup.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lead: { select: { id: true, customerName: true, statusCode: true } },
        customer: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.crmFollowup.count({ where }),
  ]);

  return NextResponse.json({ followups, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const followup = await prisma.crmFollowup.create({ data: body });
  return NextResponse.json(followup, { status: 201 });
}
