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
  const leadType = searchParams.get("leadType");
  const assigneeId = searchParams.get("assigneeId");
  const search = searchParams.get("search") || "";

  const where = {
    ...(status ? { statusCode: status } : {}),
    ...(leadType ? { leadType } : {}),
    ...(assigneeId ? { assigneeId: Number(assigneeId) } : {}),
    ...(search
      ? {
          OR: [
            { customerName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.crmLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.crmLead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const lead = await prisma.crmLead.create({ data: body });
  return NextResponse.json(lead, { status: 201 });
}
